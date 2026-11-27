from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
from pathlib import Path
import time
from typing import Deque, Dict, List, Tuple
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.adapters.economic_calendar import evaluate_news_shield, fetch_economic_calendar
from app.adapters.forex_feed import LIVE_MT5_QUOTES, PAIR_SPECS, get_forex_candles, normalize_ui_symbol
from app.ai_voice import (
    detect_voice_command_actions,
    generate_jarvis_response,
    synthesize_jarvis_mp3_b64,
)
from app.adapters.mt5_live import (
    get_mt5_bridge_telemetry,
    init_mt5_on_main_thread,
    launch_and_connect_mt5_main_thread,
)
from app.config import get_settings
from app.database import init_db
from app.quant.engine import analyze_pair
from app.scheduler import (
    AUTO_DISPATCH_STATE,
    CRON_TELEMETRY,
    ack_auto_signal,
    get_active_auto_signals,
    get_recent_persisted_signals,
    start_background_cron,
    stop_background_cron,
    sync_all_pairs_and_signals,
    toggle_auto_dispatch,
)

GATEKEEPER_AUDIT_LOG: Deque[Dict] = deque(maxlen=25)
DASHBOARD_RAM_CACHE: Dict[Tuple[str, str, str, bool], Tuple[float, Dict]] = {}
DASHBOARD_CACHE_TTL_SEC = 3.5

# Multi-Account Registry populated every 2.5s by Amaterasu X Master Bridges (Acc 1 #5100221532 & Acc 5 #5100242908)
ACCOUNT_LABELS: Dict[int, Tuple[str, str]] = {
    5100221532: ("AKAUN 1 · DRAGON CENT", "USC"),
    5100242908: ("AKAUN 5 · WAN FAROUK ($5K STD)", "USD"),
    5100221534: ("AKAUN 3 · TIGER STANDARD", "USD"),
    5100209626: ("AKAUN 3 · TIGER STANDARD", "USD"),
}
SYNCED_MT5_ACCOUNTS: Dict[int, Dict] = {}

# Persistent Per-Account Trading Switch (Boss Mandate: Acc 5 ON, Acc 1 OFF until further notice!)
ACCOUNT_CONTROLS_FILE = Path(__file__).resolve().parent.parent / "account_controls.json"
DEFAULT_ACCOUNT_TRADING_ENABLED: Dict[str, bool] = {
    "5100221532": False,  # AKAUN 1 -> OFF (LOCKED BY BOSS)
    "5100242908": True,   # AKAUN 5 -> ON  (ACTIVE)
}


def _load_account_controls() -> Dict[str, bool]:
    state = dict(DEFAULT_ACCOUNT_TRADING_ENABLED)
    if ACCOUNT_CONTROLS_FILE.exists():
        try:
            saved = json.loads(ACCOUNT_CONTROLS_FILE.read_text(encoding="utf-8"))
            if isinstance(saved, dict):
                for k, v in saved.items():
                    state[str(k)] = bool(v)
        except Exception:
            pass
    return state


def _save_account_controls(state: Dict[str, bool]) -> None:
    try:
        ACCOUNT_CONTROLS_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    except Exception:
        pass


ACCOUNT_TRADING_ENABLED: Dict[str, bool] = _load_account_controls()


def is_account_trading_allowed(login_id: int | str) -> bool:
    key = str(login_id).strip()
    if key in ACCOUNT_TRADING_ENABLED:
        return bool(ACCOUNT_TRADING_ENABLED[key])
    # Default: Account 1 OFF, Account 5 ON
    if key == "5100221532":
        return False
    return True


def _build_synced_accounts_view(direct_ipc: Dict) -> List[Dict]:
    now_ts = time.time()
    # Seed from direct local IPC if present
    if direct_ipc.get("connected") and direct_ipc.get("account_login"):
        ipc_login = int(direct_ipc["account_login"])
        lbl, def_ccy = ACCOUNT_LABELS.get(ipc_login, (f"MT5 MASTER #{ipc_login}", direct_ipc.get("currency", "USD")))
        existing = SYNCED_MT5_ACCOUNTS.get(ipc_login)
        if not existing or (now_ts - float(existing.get("last_seen_epoch", 0))) > 8.0:
            SYNCED_MT5_ACCOUNTS[ipc_login] = {
                "login": ipc_login,
                "label": lbl,
                "connected": True,
                "broker_server": direct_ipc.get("broker_server") or "VersusTrade-Live1",
                "balance": direct_ipc.get("balance", 0.0),
                "equity": direct_ipc.get("equity", 0.0),
                "floating_pnl": direct_ipc.get("floating_pnl", 0.0),
                "currency": direct_ipc.get("currency") or def_ccy,
                "win_rate": 0.0,
                "realized_profit": 0.0,
                "open_positions_count": direct_ipc.get("open_positions_count", 0),
                "positions": direct_ipc.get("positions", []),
                "last_seen_epoch": now_ts,
                "source": "DIRECT_IPC",
            }

    # Always return Account 1 (#5100221532) and Account 5 (#5100242908) first, plus any other active synced accounts
    priority_logins = [5100221532, 5100242908]
    for extra_login in list(SYNCED_MT5_ACCOUNTS.keys()):
        if extra_login not in priority_logins:
            priority_logins.append(extra_login)

    cards: List[Dict] = []
    for lg in priority_logins:
        lbl, def_ccy = ACCOUNT_LABELS.get(lg, (f"MT5 MASTER #{lg}", "USD"))
        rec = SYNCED_MT5_ACCOUNTS.get(lg)
        trade_on = is_account_trading_allowed(lg)
        if rec and (now_ts - float(rec.get("last_seen_epoch", 0))) < 45.0:
            item = dict(rec)
            item["connected"] = True
            item["trading_enabled"] = trade_on
            item["age_sec"] = round(now_ts - float(rec.get("last_seen_epoch", now_ts)), 1)
            cards.append(item)
        else:
            cards.append(
                {
                    "login": lg,
                    "label": lbl,
                    "connected": False,
                    "trading_enabled": trade_on,
                    "broker_server": "VersusTrade-Live1",
                    "balance": rec.get("balance", 0.0) if rec else 0.0,
                    "equity": rec.get("equity", 0.0) if rec else 0.0,
                    "floating_pnl": 0.0,
                    "currency": def_ccy,
                    "win_rate": rec.get("win_rate", 0.0) if rec else 0.0,
                    "realized_profit": rec.get("realized_profit", 0.0) if rec else 0.0,
                    "open_positions_count": 0,
                    "positions": [],
                    "age_sec": None,
                    "source": "WAITING_BRIDGE",
                }
            )
    return cards


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_backend = init_db()
    init_mt5_on_main_thread()
    start_background_cron(db_backend)
    yield
    stop_background_cron()


app = FastAPI(
    title="OMNIQUANT FX x AMATERASU X — Autonomous Forex Intelligence API",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_static_cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/_next/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif path in ("/", "/index.html"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response


def _build_24h_timeline(
    events: List[Dict],
    active_symbol: str,
    candles: List[Dict],
    signals_24h: List[Dict] | None = None,
) -> Dict:
    now_utc = datetime.now(timezone.utc)
    now_hour = round(now_utc.hour + now_utc.minute / 60.0, 2)

    news_spans = []
    for ev in events:
        if ev["impact"] in ("HIGH", "MEDIUM"):
            h = float(ev["utc_hour"])
            half_w = 0.5 if ev["impact"] == "HIGH" else 0.3
            news_spans.append(
                {
                    "start": max(0.0, round(h - half_w, 2)),
                    "end": min(24.0, round(h + half_w, 2)),
                    "label": f"{ev['currency']} {ev['title'][:22]}",
                    "impact": ev["impact"],
                    "currency": ev["currency"],
                }
            )

    sig_spans = []
    if signals_24h:
        for s in signals_24h[-28:]:
            sh = float(s["utc_hour"])
            sig_spans.append(
                {
                    "start": sh,
                    "end": min(24.0, round(sh + 0.38, 2)),
                    "type": s["type"],
                    "label": f"{active_symbol} {s['type']} @ {s['price']}",
                }
            )
    else:
        for c in candles[-96:]:
            if c.get("signal"):
                dt = datetime.fromisoformat(c["timestamp"])
                sh = round(dt.hour + dt.minute / 60.0, 2)
                sig_spans.append(
                    {
                        "start": sh,
                        "end": min(24.0, round(sh + 0.45, 2)),
                        "type": c["signal"],
                        "label": f"{active_symbol} {c['signal']} @ {c['close']}",
                    }
                )

    tracks = [
        {
            "id": "tokyo",
            "label": "ASIA + LDN TRAP",
            "spans": [
                {"start": 0.0, "end": 6.0, "kind": "SESSION_ASIA", "text": "TOKYO SESSION (00-06 UTC)"},
                {"start": 6.0, "end": 8.0, "kind": "NEWS_MED", "text": "LDN TRAP ZONE (14-16 MYT)"},
            ],
        },
        {
            "id": "london",
            "label": "LONDON KILLZONE",
            "spans": [{"start": 8.0, "end": 17.0, "kind": "SESSION_LONDON", "text": "LONDON SESSION (08:00-17:00 UTC)"}],
        },
        {
            "id": "overlap",
            "label": "LDN / NY OVERLAP",
            "spans": [{"start": 13.0, "end": 17.0, "kind": "SESSION_OVERLAP", "text": "PRIME NY GOLD BOOST (21:00-01:00 MYT)"}],
        },
        {
            "id": "newyork",
            "label": "NEW YORK SESSION",
            "spans": [{"start": 13.0, "end": 22.0, "kind": "SESSION_NY", "text": "NEW YORK SESSION (13:00-22:00 UTC)"}],
        },
        {
            "id": "signals_track",
            "label": f"{active_symbol} SIGNALS ({len(sig_spans)})",
            "spans": [
                {
                    "start": ss["start"],
                    "end": ss["end"],
                    "kind": "SIG_BUY" if ss["type"] == "BUY" else "SIG_SELL",
                    "text": ss["label"],
                }
                for ss in sig_spans[-28:]
            ],
        },
    ]

    return {
        "current_utc_hour": now_hour,
        "utc_clock": now_utc.strftime("%H:%M:%S UTC"),
        "tracks": tracks,
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ONLINE",
        "engine": "OMNIQUANT FX x AMATERASU X CORE v1.2",
        "mt5": get_mt5_bridge_telemetry(),
        "cron": CRON_TELEMETRY,
    }


@app.post("/api/v1/mt5/connect")
async def connect_mt5_terminal():
    res = launch_and_connect_mt5_main_thread()
    DASHBOARD_RAM_CACHE.clear()
    if res.get("ok"):
        sync_all_pairs_and_signals("M15")
    return res


@app.post("/api/market/sync-mt5")
async def receive_amaterasu_bridge_heartbeat(request: Request):
    """
    Receives real-time 2.5s heartbeat pushes from ALL running Amaterasu X Master Bridges
    (e.g. Account 1 #5100221532 Dragon Cent & Account 5 #5100242908 Wan Farouk $5K Standard).
    """
    try:
        body = await request.json()
    except Exception:
        return {"ok": False}

    now_ts = time.time()
    quotes = body.get("quotes") or {}
    for raw_sym, qdata in quotes.items():
        if isinstance(qdata, dict) and qdata.get("bid") and qdata.get("ask"):
            norm_s = normalize_ui_symbol(str(raw_sym))
            if norm_s in PAIR_SPECS:
                spec = PAIR_SPECS[norm_s]
                bid_v = float(qdata["bid"])
                ask_v = float(qdata["ask"])
                LIVE_MT5_QUOTES[norm_s] = {
                    "broker_symbol": str(raw_sym),
                    "bid": round(bid_v, int(spec["digits"])),
                    "ask": round(ask_v, int(spec["digits"])),
                    "spread_pips": round(abs(ask_v - bid_v) / max(spec["pip"], 1e-9), 1),
                    "digits": int(spec["digits"]),
                    "pip": spec["pip"],
                }

    acc_info = body.get("accountInfo") or {}
    open_pos = body.get("openPositions") or []
    if acc_info and acc_info.get("login"):
        lg = int(acc_info["login"])
        lbl, def_ccy = ACCOUNT_LABELS.get(lg, (f"MT5 MASTER #{lg}", "USD"))
        formatted_pos = [
            {
                "ticket": int(p.get("ticket", 0)),
                "symbol": str(p.get("symbol", "")),
                "type": str(p.get("type", "BUY")),
                "volume": float(p.get("volume", 0.20)),
                "price_open": float(p.get("openPrice", 0.0)),
                "price_current": float(p.get("currentPrice", p.get("openPrice", 0.0))),
                "sl": float(p.get("sl", 0.0)),
                "tp": float(p.get("tp", 0.0)),
                "profit": round(float(p.get("profit", 0.0)), 2),
                "origin": "AMATERASU_BOT",
            }
            for p in open_pos[:12]
        ]

        SYNCED_MT5_ACCOUNTS[lg] = {
            "login": lg,
            "label": lbl,
            "connected": True,
            "broker_server": str(acc_info.get("server") or "VersusTrade-Live1"),
            "balance": round(float(acc_info.get("balance", 0.0)), 2),
            "equity": round(float(acc_info.get("equity", 0.0)), 2),
            "floating_pnl": round(float(acc_info.get("profit", 0.0)), 2),
            "currency": str(acc_info.get("currency") or def_ccy),
            "win_rate": round(float(acc_info.get("winRate", 0.0)), 1),
            "realized_profit": round(float(acc_info.get("realizedProfit", 0.0)), 2),
            "open_positions_count": len(open_pos),
            "positions": formatted_pos,
            "last_seen_epoch": now_ts,
            "source": "BRIDGE_HEARTBEAT",
        }
        return {
            "ok": True,
            "syncedAccounts": len(SYNCED_MT5_ACCOUNTS),
            "accountTradingEnabled": is_account_trading_allowed(lg),
        }

    return {"ok": True, "syncedAccounts": len(SYNCED_MT5_ACCOUNTS)}


@app.post("/api/v1/accounts/{login_id}/toggle")
def toggle_specific_account_trading(login_id: int, enabled: bool | None = Query(None)):
    key = str(login_id)
    cur = is_account_trading_allowed(key)
    new_val = (not cur) if enabled is None else bool(enabled)
    ACCOUNT_TRADING_ENABLED[key] = new_val
    _save_account_controls(ACCOUNT_TRADING_ENABLED)
    DASHBOARD_RAM_CACHE.clear()
    return {
        "ok": True,
        "login": login_id,
        "trading_enabled": new_val,
        "controls": ACCOUNT_TRADING_ENABLED,
    }


@app.get("/api/v1/auto-signals")
def get_omniquant_auto_signals(login: str = Query("", description="MT5 Account Login polling for signals")):
    """
    Polled every 4s by Amaterasu X Master Bridges.
    Enforces per-account trading switch (e.g. Account 5 ON, Account 1 OFF)!
    """
    if login and not is_account_trading_allowed(login):
        return {
            "enabled": False,
            "accountPaused": True,
            "minConfidence": float(AUTO_DISPATCH_STATE.get("min_confidence", 75.0)),
            "activeSignals": [],
            "history": [],
            "executionAcks": list(AUTO_DISPATCH_STATE.get("execution_acks", []))[:10],  # type: ignore
        }

    return {
        "enabled": bool(AUTO_DISPATCH_STATE.get("enabled", True)),
        "accountPaused": False,
        "minConfidence": float(AUTO_DISPATCH_STATE.get("min_confidence", 75.0)),
        "activeSignals": get_active_auto_signals(login),
        "history": list(AUTO_DISPATCH_STATE.get("history", []))[:10],  # type: ignore
        "executionAcks": list(AUTO_DISPATCH_STATE.get("execution_acks", []))[:10],  # type: ignore
    }


@app.post("/api/v1/auto-signals/ack")
async def acknowledge_omniquant_auto_signal(request: Request):
    """
    Receives execution confirmation or rejection telemetry from Amaterasu X MT5 Bridges.
    """
    try:
        body = await request.json()
    except Exception:
        return {"ok": False}

    res = ack_auto_signal(
        sig_id=str(body.get("signal_id", "")),
        login=str(body.get("login", "")),
        status=str(body.get("status", "UNKNOWN")),
        symbol=str(body.get("symbol", "")),
        ticket=int(body.get("ticket", 0) or 0),
        price=float(body.get("price", 0.0) or 0.0),
        volume=float(body.get("volume", 0.0) or 0.0),
        reason=str(body.get("reason", "")),
    )
    DASHBOARD_RAM_CACHE.clear()
    return res


@app.post("/api/v1/auto-trade/toggle")
def toggle_omniquant_auto_trade(enabled: bool | None = Query(None)):
    res = toggle_auto_dispatch(enabled)
    DASHBOARD_RAM_CACHE.clear()
    return res


@app.get("/api/v1/gatekeeper")
def evaluate_amaterasu_gatekeeper(
    symbol: str = Query("XAUUSD", description="Broker or UI symbol, e.g. XAUUSD, USDCHF, EURUSD"),
    action: str = Query("BUY", description="Proposed Amaterasu X order direction: BUY or SELL"),
    timeframe: str = Query("M15", description="Timeframe for quantitative check"),
    login: str = Query("", description="MT5 Account Login checking gatekeeper"),
    is_news_signal: bool = Query(False, description="True if signal is an explicit News Volatility trade"),
    enforce_news_shield: bool = Query(False, description="News Shield removed per Boss mandate"),
):
    if login and not is_account_trading_allowed(login):
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "symbol": normalize_ui_symbol(symbol),
            "proposed_action": action.upper().strip(),
            "approved": False,
            "verdict": "BLOCK",
            "reason_code": "ACCOUNT_PAUSED_BY_BOSS",
            "reason": f"Akaun #{login} sedang OFF mengikut arahan Bos.",
            "confidence": 0.0,
            "pattern_similarity": 0.0,
            "matching_prob_pct": 0.0,
            "data_source": "BOSS_CONTROL",
        }
    """
    Pre-Trade Quantitative Gatekeeper for Amaterasu X Auto-Bot (`amaterasu_mt5_bridge.py`).
    Evaluates News Shield, Indicator Confluence (RSI/MACD/MA/TickVol), Hurst Persistence,
    and Top-5 Historical Pattern / Monte Carlo probability before MT5 order execution.
    """
    settings = get_settings()
    ui_sym = normalize_ui_symbol(symbol)
    proposed = action.upper().strip()
    now_utc = datetime.now(timezone.utc)

    events = fetch_economic_calendar(now_utc)
    news_status = evaluate_news_shield(ui_sym, events, settings.news_shield_minutes)
    candles, source = get_forex_candles(ui_sym, timeframe, count=420)

    analysis = analyze_pair(
        symbol=ui_sym,
        timeframe=timeframe,
        candles=candles,
        session_filter="ALL",
        news_shield_enabled=enforce_news_shield,
        news_status=news_status,
        data_source=source,
    )

    sig = analysis["signal"]
    pm = analysis["pattern_matching"]
    ind = analysis["indicators_latest"]
    perf = analysis["performance"]

    want_buy = proposed == "BUY"
    quant_bull = sig["raw_bias"] == "BULLISH"
    aligned = (want_buy and quant_bull) or ((not want_buy) and (not quant_bull))
    matching_prob = pm["bullish_prob_pct"] if want_buy else pm["bearish_prob_pct"]
    conf = float(sig["confidence"])

    approved = True
    verdict = "APPROVE"
    reason_code = "QUANT_CLEAR"
    lot_mult = 1.0

    if (not aligned) and conf >= 68.0 and matching_prob < 42.0:
        approved = False
        verdict = "BLOCK"
        reason_code = "STRONG_QUANT_OPPOSITION"
        reason = (
            f"Konflik Kuantitatif Kuat: OMNIQUANT cenderung {sig['raw_bias']} "
            f"({conf:.1f}% conf, kebarangkalian {proposed} cuma {matching_prob:.1f}%)"
        )
        lot_mult = 0.0
    elif aligned and conf >= 72.0 and matching_prob >= 58.0:
        approved = True
        verdict = "BOOST"
        reason_code = "A_PLUS_CONFLUENCE"
        reason = (
            f"Gred A+ Confluence: {sig['regime']} selari {proposed} "
            f"(Conf {conf:.1f}%, Pattern {pm['avg_similarity_pct']:.1f}%, Prob {matching_prob:.1f}%)"
        )
        lot_mult = 1.2
    else:
        approved = True
        verdict = "APPROVE"
        reason_code = "QUANT_CLEAR"
        reason = (
            f"Lulus Penapis Quant: {sig['regime']} | Conf {conf:.1f}% | "
            f"Pattern Sim {pm['avg_similarity_pct']:.1f}% | Prob {matching_prob:.1f}%"
        )

    record = {
        "timestamp": now_utc.isoformat(),
        "symbol": ui_sym,
        "proposed_action": proposed,
        "approved": approved,
        "verdict": verdict,
        "reason_code": reason_code,
        "reason": reason,
        "quant_direction": sig["direction"],
        "raw_bias": sig["raw_bias"],
        "confidence": conf,
        "pattern_similarity": pm["avg_similarity_pct"],
        "matching_prob_pct": round(matching_prob, 1),
        "rsi14": ind["rsi14"],
        "vol_zscore": ind["vol_zscore"],
        "hurst": perf["hurst"],
        "regime": sig["regime"],
        "data_source": source,
        "recommended_lot_multiplier": lot_mult,
    }
    GATEKEEPER_AUDIT_LOG.appendleft(record)
    return record


@app.get("/api/v1/dashboard")
def get_dashboard_payload(
    symbol: str = Query("XAU/USD", description="Forex or Metal pair, e.g. XAU/USD, USD/CHF, EUR/USD"),
    timeframe: str = Query("M15", description="Timeframe: M5, M15, H1, H4"),
    session_filter: str = Query("ALL", description="ALL | LONDON | NEW_YORK | OVERLAP"),
    news_shield: bool = Query(True, description="Enable ±30m High-Impact Economic News Shield"),
):
    settings = get_settings()
    symbol = normalize_ui_symbol(symbol)
    cache_key = (symbol, timeframe.upper(), session_filter.upper(), bool(news_shield))
    now_mono = time.monotonic()
    cached_entry = DASHBOARD_RAM_CACHE.get(cache_key)
    if cached_entry and (now_mono - cached_entry[0]) < DASHBOARD_CACHE_TTL_SEC:
        payload = dict(cached_entry[1])
        payload["gatekeeper_logs"] = list(GATEKEEPER_AUDIT_LOG)[:8]
        payload["synced_accounts"] = _build_synced_accounts_view(payload.get("mt5_bridge") or {})
        payload["auto_dispatch"] = {
            "enabled": bool(AUTO_DISPATCH_STATE.get("enabled", True)),
            "min_confidence": float(AUTO_DISPATCH_STATE.get("min_confidence", 75.0)),
            "active_count": len(get_active_auto_signals()),
            "history": list(AUTO_DISPATCH_STATE.get("history", []))[:6],  # type: ignore
            "execution_acks": list(AUTO_DISPATCH_STATE.get("execution_acks", []))[:6],  # type: ignore
        }
        return payload

    now_utc = datetime.now(timezone.utc)
    events = fetch_economic_calendar(now_utc)
    news_status = evaluate_news_shield(symbol, events, settings.news_shield_minutes)

    candles, source = get_forex_candles(symbol, timeframe, count=420)
    active_analysis = analyze_pair(
        symbol=symbol,
        timeframe=timeframe,
        candles=candles,
        session_filter=session_filter,
        news_shield_enabled=news_shield,
        news_status=news_status,
        data_source=source,
    )

    mt5_telemetry = get_mt5_bridge_telemetry()

    cached_matrix: Dict = dict(CRON_TELEMETRY.get("cached_matrix") or {})
    cached_matrix[symbol] = {
        "symbol": symbol,
        "price": active_analysis["quote"]["price"],
        "bid": active_analysis["quote"]["bid"],
        "ask": active_analysis["quote"]["ask"],
        "spread_pips": active_analysis["quote"]["spread_pips"],
        "digits": active_analysis["quote"]["digits"],
        "change_pct": active_analysis["quote"]["change_pct"],
        "atr_pips": active_analysis["quote"]["atr_pips"],
        "rsi14": active_analysis["indicators_latest"]["rsi14"],
        "macd_hist": active_analysis["indicators_latest"]["macd_hist"],
        "vol_zscore": active_analysis["indicators_latest"]["vol_zscore"],
        "direction": active_analysis["signal"]["direction"],
        "raw_bias": active_analysis["signal"]["raw_bias"],
        "confidence": active_analysis["signal"]["confidence"],
        "entry": active_analysis["signal"]["entry"],
        "stop_loss": active_analysis["signal"]["stop_loss"],
        "take_profit": active_analysis["signal"]["take_profit"],
        "regime": active_analysis["signal"]["regime"],
        "pattern_sim": active_analysis["pattern_matching"]["avg_similarity_pct"],
        "news_blocked": active_analysis["signal"]["news_blocked"],
    }

    right_nodes = []
    anchor_angles_right = [332, 348, 4, 20, 36, 52, 316, 300]
    # Show Amaterasu X Top 3 Whitelist Pairs + GBP/USD on Right Torus HUD
    for i, pair_key in enumerate(settings.tracked_pairs[:4]):
        m = cached_matrix.get(pair_key)
        if m:
            right_nodes.append(
                {
                    "id": f"pair_{pair_key}",
                    "label": f"{pair_key} {'★' if pair_key in ('XAU/USD','USD/CHF','EUR/USD') else ''}".strip(),
                    "value": f"{m['direction']} · {m['confidence']:.0f}%",
                    "sub": f"Px {m['price']:.{m['digits']}f} · RSI {m['rsi14']:.1f}",
                    "bias": "WARN" if m["news_blocked"] else ("BULL" if m["raw_bias"] == "BULLISH" else "BEAR"),
                    "anchor_angle": anchor_angles_right[i % len(anchor_angles_right)],
                }
            )

    next_ev = news_status.get("next_event")
    right_nodes.extend(
        [
            {
                "id": "amaterasu_mt5",
                "label": "AMATERASU MT5 BRIDGE",
                "value": (
                    f"LIVE #{mt5_telemetry['account_login']}"
                    if mt5_telemetry["connected"]
                    else "GATEKEEPER READY"
                ),
                "sub": (
                    f"{mt5_telemetry['open_positions_count']} Open · PnL {mt5_telemetry['floating_pnl']:+.2f} {mt5_telemetry['currency']}"
                    if mt5_telemetry["connected"]
                    else "Waiting MT5 Terminal IPC"
                ),
                "bias": "BULL" if mt5_telemetry["connected"] else "NEUTRAL",
                "anchor_angle": 36,
            },
            {
                "id": "auto_scalp_engine",
                "label": "AUTO-SCALP ENGINE",
                "value": "ACTIVE ≥75%" if AUTO_DISPATCH_STATE.get("enabled", True) else "PAUSED",
                "sub": f"20s Scan · {len(get_active_auto_signals())} Active Signals",
                "bias": "BULL" if AUTO_DISPATCH_STATE.get("enabled", True) else "WARN",
                "anchor_angle": 52,
            },
            {
                "id": "session_gate",
                "label": "SESSION / TRAP GUARD",
                "value": active_analysis["signal"]["session_current"],
                "sub": f"Filter: {session_filter} ({'OPEN' if active_analysis['signal']['session_allowed'] else 'GATED'})",
                "bias": "BULL" if active_analysis["signal"]["session_allowed"] else "WARN",
                "anchor_angle": 316,
            },
            {
                "id": "cron_db",
                "label": "GATEKEEPER / CRON",
                "value": f"SYNC #{CRON_TELEMETRY['sync_count']}",
                "sub": f"{len(GATEKEEPER_AUDIT_LOG)} Bot Checks · {CRON_TELEMETRY['db_backend']}",
                "bias": "BULL",
                "anchor_angle": 300,
            },
        ]
    )

    active_analysis["manifold"]["right_nodes"] = right_nodes
    timeline = _build_24h_timeline(
        events,
        symbol,
        active_analysis["candles"],
        active_analysis.get("signals_24h"),
    )

    ordered_matrix = [cached_matrix[p] for p in settings.tracked_pairs if p in cached_matrix]

    synced_accounts_list = _build_synced_accounts_view(mt5_telemetry)
    # If direct IPC wasn't attached yet, promote any active bridge heartbeat into mt5_bridge summary!
    if not mt5_telemetry.get("connected"):
        live_bridge_acc = next((a for a in synced_accounts_list if a.get("connected")), None)
        if live_bridge_acc:
            mt5_telemetry = {
                "connected": True,
                "account_login": live_bridge_acc["login"],
                "broker_server": live_bridge_acc["broker_server"],
                "balance": live_bridge_acc["balance"],
                "equity": live_bridge_acc["equity"],
                "currency": live_bridge_acc["currency"],
                "open_positions_count": sum(a.get("open_positions_count", 0) for a in synced_accounts_list if a.get("connected")),
                "floating_pnl": round(sum(a.get("floating_pnl", 0.0) for a in synced_accounts_list if a.get("connected")), 2),
                "positions": [p for a in synced_accounts_list if a.get("connected") for p in a.get("positions", [])][:12],
            }

    result_payload = {
        "active": active_analysis,
        "matrix": ordered_matrix,
        "mt5_bridge": mt5_telemetry,
        "synced_accounts": synced_accounts_list,
        "cached_entry_auto_inject": True,
        "auto_dispatch": {
            "enabled": bool(AUTO_DISPATCH_STATE.get("enabled", True)),
            "min_confidence": float(AUTO_DISPATCH_STATE.get("min_confidence", 75.0)),
            "active_count": len(get_active_auto_signals()),
            "history": list(AUTO_DISPATCH_STATE.get("history", []))[:6],  # type: ignore
            "execution_acks": list(AUTO_DISPATCH_STATE.get("execution_acks", []))[:6],  # type: ignore
        },
        "gatekeeper_logs": list(GATEKEEPER_AUDIT_LOG)[:8],
        "economic_calendar": {
            "shield_enabled": news_shield,
            "status": news_status,
            "events": events,
        },
        "timeline": timeline,
        "cron": {
            "status": CRON_TELEMETRY["status"],
            "last_sync_utc": CRON_TELEMETRY["last_sync_utc"],
            "sync_count": CRON_TELEMETRY["sync_count"],
            "interval_seconds": settings.cron_interval_seconds,
            "db_backend": CRON_TELEMETRY["db_backend"],
        },
        "recent_signals": get_recent_persisted_signals(10),
    }
    DASHBOARD_RAM_CACHE[cache_key] = (time.monotonic(), result_payload)
    return result_payload


@app.post("/api/v1/signals/refresh")
def trigger_manual_signal_scan(timeframe: str = Query("M15")):
    telemetry = sync_all_pairs_and_signals(timeframe=timeframe)
    DASHBOARD_RAM_CACHE.clear()
    return {
        "ok": True,
        "message": "Quantitative signal scan & DB persistence completed.",
        "cron": telemetry,
        "recent_signals": get_recent_persisted_signals(10),
    }


@app.get("/api/v1/signals/history")
def list_signal_history(limit: int = Query(25, ge=1, le=100)):
    return {"signals": get_recent_persisted_signals(limit)}


@app.post("/api/v1/ai/voice-chat")
async def ai_jarvis_voice_chat(request: Request):
    """
    JARVIS Malay Voice AI Endpoint:
    1. Executes spoken commands (ON/OFF accounts, Auto-Trade, Chart switching)
    2. Answers ANY user question with live MT5 & Quantitative data
    3. Synthesizes natural Malaysian Male Corporate Neural Voice (ms-MY-OsmanNeural)
    """
    try:
        body = await request.json()
    except Exception:
        return {"ok": False, "reply": "Maaf Bos, input suara tidak dapat dibaca."}

    user_msg = str(body.get("message") or "").strip()
    if not user_msg:
        return {"ok": False, "reply": "Sila sebut soalan atau arahan Bos."}

    cur_sym = str(body.get("symbol") or "XAU/USD")
    cur_tf = str(body.get("timeframe") or "M5")
    history = body.get("history") or []

    action_note, ui_action = detect_voice_command_actions(
        transcript=user_msg,
        toggle_account_fn=lambda lg, en: toggle_specific_account_trading(lg, en),
        toggle_autotrade_fn=lambda en: toggle_omniquant_auto_trade(en),
    )

    eff_sym = ui_action.get("symbol") or cur_sym
    eff_tf = ui_action.get("timeframe") or cur_tf
    live_ctx = get_dashboard_payload(
        symbol=eff_sym,
        timeframe=eff_tf,
        session_filter="ALL",
        news_shield=False,
    )

    reply_text, audio_b64 = await generate_jarvis_response(
        user_message=user_msg,
        history=history,
        live_context=live_ctx,
        action_note=action_note,
    )

    return {
        "ok": True,
        "reply": reply_text,
        "audio_b64": audio_b64,
        "ui_action": ui_action,
        "action_executed": bool(action_note),
    }


@app.post("/api/v1/ai/speak")
async def ai_jarvis_speak(request: Request):
    try:
        body = await request.json()
    except Exception:
        return {"ok": False, "audio_b64": None}
    text = str(body.get("text") or "").strip()
    audio_b64 = await synthesize_jarvis_mp3_b64(text)
    return {"ok": bool(audio_b64), "audio_b64": audio_b64}


STATIC_UI_DIR = Path(__file__).resolve().parent.parent / "static_ui"
if STATIC_UI_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_UI_DIR), html=True), name="static_ui")
