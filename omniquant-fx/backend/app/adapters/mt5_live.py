from datetime import datetime, timezone
import json
import os
import subprocess
import threading
import time
from typing import Dict, List, Optional, Tuple
from app.config import get_settings

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    mt5 = None
    MT5_AVAILABLE = False

_mt5_lock = threading.Lock()
_mt5_initialized = False
_last_proc_check_ts = 0.0
_last_proc_running = False
_broker_symbol_cache: Dict[str, str] = {}

KNOWN_MT5_PATHS = [
    r"C:\VersusTrade_Acc2\terminal64.exe",
    r"C:\VersusTrade_Acc3\terminal64.exe",
    r"C:\VersusTrade_Acc5\terminal64.exe",
    r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe",
    r"C:\Program Files\MetaTrader 5 EXNESS\terminal64.exe",
    r"C:\Program Files\MetaTrader 5\terminal64.exe",
]


def _load_amaterasu_bridge_cfg() -> Dict:
    for cfg_path in [
        r"C:\AmaterasuX\bridge_config.json",
        r"C:\AmaterasuX_Acc2\bridge_config.json",
        r"C:\AmaterasuX_Acc5\bridge_config.json",
        r"C:\Users\US\.gemini\antigravity\scratch\trading-academy-app\bridge_config.json",
    ]:
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8-sig") as f:
                    data = json.load(f)
                    if data.get("mt5_terminal_path") or data.get("mt5_login"):
                        return data
            except Exception:
                pass
    return {}


def _is_terminal64_running() -> bool:
    global _last_proc_check_ts, _last_proc_running
    now = time.time()
    if now - _last_proc_check_ts < 5.0:
        return _last_proc_running
    _last_proc_check_ts = now
    if os.name != "nt":
        _last_proc_running = False
        return False
    try:
        out = subprocess.check_output(
            ["tasklist", "/FI", "IMAGENAME eq terminal64.exe", "/NH"],
            stderr=subprocess.DEVNULL,
            timeout=1.5,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        ).decode("utf-8", errors="ignore")
        _last_proc_running = "terminal64.exe" in out.lower()
    except Exception:
        _last_proc_running = False
    return _last_proc_running


def init_mt5_on_main_thread() -> bool:
    """
    MUST be called from Python's main thread (FastAPI lifespan startup or async route).
    MetaTrader5's Windows IPC requires initialization on the main STA thread; once initialized,
    data reads (`copy_rates_from_pos`, `account_info`, `positions_get`) work across all threads in <3ms.
    """
    global _mt5_initialized
    if not MT5_AVAILABLE or mt5 is None:
        return False

    if not _is_terminal64_running():
        _mt5_initialized = False
        return False

    with _mt5_lock:
        if _mt5_initialized and mt5.terminal_info() is not None and mt5.account_info() is not None:
            return True

        settings = get_settings()
        bridge_cfg = _load_amaterasu_bridge_cfg()

        candidate_paths: List[str] = []
        if settings.mt5_terminal_path and os.path.exists(settings.mt5_terminal_path):
            candidate_paths.append(settings.mt5_terminal_path)

        cfg_term = str(bridge_cfg.get("mt5_terminal_path", "")).strip()
        if cfg_term and os.path.exists(cfg_term) and cfg_term not in candidate_paths:
            candidate_paths.append(cfg_term)

        for kp in KNOWN_MT5_PATHS:
            if os.path.exists(kp) and kp not in candidate_paths:
                candidate_paths.append(kp)

        for path in candidate_paths:
            if bridge_cfg.get("mt5_login") and bridge_cfg.get("mt5_password") and bridge_cfg.get("mt5_server"):
                if not cfg_term or os.path.normcase(path) == os.path.normcase(cfg_term):
                    if mt5.initialize(
                        path=path,
                        login=int(bridge_cfg["mt5_login"]),
                        password=str(bridge_cfg["mt5_password"]),
                        server=str(bridge_cfg["mt5_server"]),
                        timeout=8000,
                    ):
                        if mt5.account_info() is not None:
                            _mt5_initialized = True
                            return True

            if mt5.initialize(path=path, timeout=4500):
                if mt5.account_info() is not None:
                    _mt5_initialized = True
                    return True

        return False


def ensure_mt5_connected() -> bool:
    """
    Zero-overhead C-level pointer check (<0.05ms) once initialized.
    Never spawns tasklist.exe on active requests!
    """
    global _mt5_initialized
    if not MT5_AVAILABLE or mt5 is None or not _mt5_initialized:
        return False
    try:
        if mt5.terminal_info() is None:
            _mt5_initialized = False
            return False
        return True
    except Exception:
        _mt5_initialized = False
        return False


def launch_and_connect_mt5_main_thread() -> Dict[str, object]:
    global _mt5_initialized, _last_proc_check_ts, _broker_symbol_cache
    if not MT5_AVAILABLE or mt5 is None:
        return {"ok": False, "message": "Modul MetaTrader5 hanya tersedia pada Windows."}

    _mt5_initialized = False
    _last_proc_check_ts = 0.0
    _broker_symbol_cache.clear()

    bridge_cfg = _load_amaterasu_bridge_cfg()
    settings = get_settings()
    exe_path = (
        settings.mt5_terminal_path
        or str(bridge_cfg.get("mt5_terminal_path", "")).strip()
    )
    if not exe_path or not os.path.exists(exe_path):
        exe_path = next((cand for cand in KNOWN_MT5_PATHS if os.path.exists(cand)), "")

    if not _is_terminal64_running() and exe_path:
        try:
            subprocess.Popen([exe_path, "/portable"], close_fds=True)
            time.sleep(3.0)
            _last_proc_check_ts = 0.0
        except Exception as exc:
            return {"ok": False, "message": f"Gagal membuka MT5: {exc}"}

    connected = init_mt5_on_main_thread()
    telemetry = get_mt5_bridge_telemetry() if connected else {"connected": False}
    if connected and telemetry.get("account_login"):
        msg = (
            f"BERJAYA! Tersambung ke {telemetry.get('broker_server')} "
            f"(Akaun #{telemetry.get('account_login')} · Ekuiti {telemetry.get('equity'):,.2f} {telemetry.get('currency')} · "
            f"{telemetry.get('open_positions_count')} Posisi Aktif)"
        )
    else:
        msg = "Terminal MT5 dikesan tetapi gagal mengesahkan akaun. Pastikan MT5 sudah log masuk."

    return {
        "ok": connected,
        "exe_path": exe_path,
        "telemetry": telemetry,
        "message": msg,
    }


def resolve_mt5_symbol(ui_symbol: str) -> Optional[str]:
    if not ensure_mt5_connected() or mt5 is None:
        return None

    clean = ui_symbol.replace("/", "").upper()
    if clean in _broker_symbol_cache:
        return _broker_symbol_cache[clean]

    candidates = [
        f"{clean}.c",
        clean,
        f"{clean}c",
        f"{clean}m",
        f"{clean}.m",
        f"{clean}.pro",
        f"{clean}.ecn",
        f"{clean}#",
    ]
    if clean == "XAUUSD":
        candidates.extend(["GOLD.c", "GOLD", "GOLDm", "GOLD.m"])

    with _mt5_lock:
        for cand in candidates:
            info = mt5.symbol_info(cand)
            if info is not None:
                mt5.symbol_select(cand, True)
                _broker_symbol_cache[clean] = cand
                return cand

        all_syms = mt5.symbols_get() or []
        for s in all_syms:
            s_up = s.name.upper()
            if s_up.startswith(clean):
                mt5.symbol_select(s.name, True)
                _broker_symbol_cache[clean] = s.name
                return s.name

    return None


def fetch_mt5_candles_and_quote(
    ui_symbol: str,
    timeframe: str = "M15",
    count: int = 420,
) -> Optional[Tuple[List[Dict], Dict, str]]:
    if not ensure_mt5_connected() or mt5 is None:
        return None

    tf_map = {
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
    }
    tf_enum = tf_map.get(timeframe.upper(), mt5.TIMEFRAME_M15)
    broker_sym = resolve_mt5_symbol(ui_symbol)
    if not broker_sym:
        return None

    with _mt5_lock:
        rates = mt5.copy_rates_from_pos(broker_sym, tf_enum, 0, count)
        sym_info = mt5.symbol_info(broker_sym)
        tick = mt5.symbol_info_tick(broker_sym)
        acc = mt5.account_info()

    if rates is None or len(rates) < 60 or sym_info is None:
        return None

    digits = int(sym_info.digits)
    pip_size = (
        0.10
        if ("XAU" in broker_sym.upper() or "GOLD" in broker_sym.upper())
        else (0.01 if "JPY" in broker_sym.upper() else 0.0001)
    )

    candles: List[Dict] = []
    for r in rates:
        dt = datetime.fromtimestamp(int(r["time"]), tz=timezone.utc)
        candles.append(
            {
                "symbol": ui_symbol,
                "timeframe": timeframe,
                "timestamp": dt.isoformat(),
                "open": round(float(r["open"]), digits),
                "high": round(float(r["high"]), digits),
                "low": round(float(r["low"]), digits),
                "close": round(float(r["close"]), digits),
                "tick_volume": float(r["tick_volume"]),
                "source": "mt5_live",
            }
        )

    bid = round(float(tick.bid), digits) if tick and tick.bid > 0 else candles[-1]["close"]
    ask = round(float(tick.ask), digits) if tick and tick.ask > 0 else candles[-1]["close"]
    spread_pips = round(abs(ask - bid) / max(pip_size, 1e-9), 1)

    live_quote = {
        "broker_symbol": broker_sym,
        "bid": bid,
        "ask": ask,
        "spread_pips": spread_pips,
        "digits": digits,
        "pip": pip_size,
    }
    server_label = f"MT5 LIVE ({acc.server} #{acc.login})" if acc else f"MT5 LIVE ({broker_sym})"
    return candles, live_quote, server_label


def get_mt5_bridge_telemetry() -> Dict:
    empty = {
        "connected": False,
        "account_login": None,
        "broker_server": None,
        "balance": 0.0,
        "equity": 0.0,
        "currency": "USD",
        "open_positions_count": 0,
        "floating_pnl": 0.0,
        "positions": [],
    }
    if not ensure_mt5_connected() or mt5 is None:
        return empty

    with _mt5_lock:
        acc = mt5.account_info()
        positions = mt5.positions_get() or []

    if not acc:
        return empty

    pos_list = []
    total_profit = 0.0
    for p in positions:
        profit = float(p.profit)
        total_profit += profit
        is_bot = bool(
            p.magic in (888999, 888995)
            or (p.comment and p.comment.startswith(("AmaterasuX", "CoachAzwanDollarMaker")))
        )
        pos_list.append(
            {
                "ticket": int(p.ticket),
                "symbol": p.symbol,
                "type": "BUY" if p.type == 0 else "SELL",
                "volume": float(p.volume),
                "price_open": float(p.price_open),
                "price_current": float(p.price_current),
                "sl": float(p.sl),
                "tp": float(p.tp),
                "profit": round(profit, 2),
                "origin": "AMATERASU_BOT" if is_bot else "MANUAL",
            }
        )

    return {
        "connected": True,
        "account_login": int(acc.login),
        "broker_server": str(acc.server),
        "company": str(acc.company),
        "balance": round(float(acc.balance), 2),
        "equity": round(float(acc.equity), 2),
        "currency": str(acc.currency),
        "open_positions_count": len(pos_list),
        "floating_pnl": round(total_profit, 2),
        "positions": pos_list[:12],
    }
