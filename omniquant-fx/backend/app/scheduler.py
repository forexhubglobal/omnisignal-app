from collections import deque
from datetime import datetime, timezone
import time
from typing import Deque, Dict, List
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import desc
from app.adapters.economic_calendar import evaluate_news_shield, fetch_economic_calendar
from app.adapters.forex_feed import get_forex_candles
from app.config import get_settings
from app.database import OHLCVCandle, QuantSignalRecord, SessionLocal
from app.quant.engine import analyze_pair

WHITELIST_AUTO_PAIRS = ("XAU/USD", "USD/CHF", "EUR/USD")

CRON_TELEMETRY: Dict[str, object] = {
    "status": "INITIALIZING",
    "last_sync_utc": None,
    "next_sync_seconds": 20,
    "sync_count": 0,
    "db_backend": "SQLite (Local Embedded)",
    "cached_matrix": {},
}

AUTO_DISPATCH_STATE: Dict[str, object] = {
    "enabled": True,
    "min_confidence": 75.0,
    "cooldown_seconds": 480.0,         # 8 minutes per symbol after confirmed MT5 execution
    "unexecuted_retry_seconds": 60.0,  # Re-emit after 60s if no bridge executed yet
    "active_signals": {},              # clean_sym -> active Amaterasu signal payload
    "last_fired_epoch": {},            # clean_sym -> epoch timestamp
    "executed_epochs": {},             # clean_sym -> last confirmed MT5 execution epoch
    "history": deque(maxlen=25),
    "execution_acks": deque(maxlen=30),
}

_scheduler: BackgroundScheduler | None = None


def get_active_auto_signals(login: str = "") -> List[Dict]:
    if not AUTO_DISPATCH_STATE.get("enabled", True):
        return []
    now_ep = time.time()
    active_map: Dict[str, Dict] = AUTO_DISPATCH_STATE["active_signals"]  # type: ignore
    results: List[Dict] = []
    for sig in active_map.values():
        if float(sig.get("expires_epoch", 0)) <= now_ep:
            continue
        exec_by = sig.get("executed_by") or {}
        if login and str(login) in exec_by:
            continue
        results.append(sig)
    return results


def ack_auto_signal(
    sig_id: str,
    login: str,
    status: str,
    symbol: str = "",
    ticket: int = 0,
    price: float = 0.0,
    volume: float = 0.0,
    reason: str = "",
) -> Dict:
    now_ep = time.time()
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_sym = symbol.replace("/", "").split(".")[0].upper()
    ack_entry = {
        "signal_id": sig_id,
        "login": str(login),
        "symbol": clean_sym,
        "status": status.upper(),
        "ticket": int(ticket or 0),
        "price": float(price or 0.0),
        "volume": float(volume or 0.0),
        "reason": reason,
        "timestamp": now_iso,
        "epoch": now_ep,
    }
    acks_dq: Deque[Dict] = AUTO_DISPATCH_STATE["execution_acks"]  # type: ignore
    acks_dq.appendleft(ack_entry)

    active_map: Dict[str, Dict] = AUTO_DISPATCH_STATE["active_signals"]  # type: ignore
    for sym_k, s_obj in active_map.items():
        if s_obj.get("id") == sig_id:
            clean_sym = sym_k
            exec_by = s_obj.setdefault("executed_by", {})
            if status.upper() == "EXECUTED":
                exec_by[str(login)] = {
                    "ticket": int(ticket or 0),
                    "price": float(price or 0.0),
                    "volume": float(volume or 0.0),
                    "timestamp": now_iso,
                }
                s_obj["mt5_status"] = f"EXECUTED #{ticket}"
            else:
                s_obj["last_reject_reason"] = reason
                s_obj["mt5_status"] = f"REJECTED: {reason[:48]}"

    if status.upper() == "EXECUTED" and clean_sym:
        exec_epochs: Dict[str, float] = AUTO_DISPATCH_STATE["executed_epochs"]  # type: ignore
        exec_epochs[clean_sym] = now_ep

    return {"ok": True, "ack": ack_entry}


def toggle_auto_dispatch(enabled: bool | None = None) -> Dict:
    cur = bool(AUTO_DISPATCH_STATE.get("enabled", True))
    new_val = (not cur) if enabled is None else bool(enabled)
    AUTO_DISPATCH_STATE["enabled"] = new_val
    if not new_val:
        AUTO_DISPATCH_STATE["active_signals"] = {}
    return {
        "enabled": new_val,
        "min_confidence": AUTO_DISPATCH_STATE["min_confidence"],
        "history": list(AUTO_DISPATCH_STATE["history"])[:8],  # type: ignore
        "execution_acks": list(AUTO_DISPATCH_STATE["execution_acks"])[:8],  # type: ignore
    }


def sync_all_pairs_and_signals(timeframe: str = "M5") -> Dict[str, object]:
    """
    High-Frequency Scalp Cron Worker (runs every 20s):
    1. Scans all tracked pairs on M5 for real-time scalp setups
    2. Auto-dispatches >=75% confidence signals on Whitelist Pairs (XAUUSD, USDCHF, EURUSD)
       to Amaterasu X Master Bridges (Account 1 & Account 5) with 12-min per-symbol cooldown!
    """
    settings = get_settings()
    now_utc = datetime.now(timezone.utc)
    now_ep = time.time()
    events = fetch_economic_calendar(now_utc)
    matrix_summary: Dict[str, Dict] = {}

    db = SessionLocal()
    try:
        for symbol in settings.tracked_pairs:
            candles, source = get_forex_candles(symbol, timeframe, count=420)
            news_status = evaluate_news_shield(symbol, events, settings.news_shield_minutes)
            analysis = analyze_pair(
                symbol=symbol,
                timeframe=timeframe,
                candles=candles,
                session_filter="ALL",
                news_shield_enabled=True,
                news_status=news_status,
                data_source=source,
            )

            # Upsert latest 4 candles
            for c in candles[-4:]:
                ts = datetime.fromisoformat(c["timestamp"])
                existing = (
                    db.query(OHLCVCandle)
                    .filter(
                        OHLCVCandle.symbol == symbol,
                        OHLCVCandle.timeframe == timeframe,
                        OHLCVCandle.timestamp == ts,
                    )
                    .first()
                )
                if existing:
                    existing.high = c["high"]
                    existing.low = c["low"]
                    existing.close = c["close"]
                    existing.tick_volume = c["tick_volume"]
                    existing.source = c["source"]
                else:
                    db.add(
                        OHLCVCandle(
                            symbol=symbol,
                            timeframe=timeframe,
                            timestamp=ts,
                            open=c["open"],
                            high=c["high"],
                            low=c["low"],
                            close=c["close"],
                            tick_volume=c["tick_volume"],
                            source=c["source"],
                        )
                    )

            sig = analysis["signal"]
            ind = analysis["indicators_latest"]
            pm = analysis["pattern_matching"]

            # Persist signal record periodically (every 3rd scan or when BUY/SELL >= 70%)
            if int(CRON_TELEMETRY["sync_count"]) % 3 == 0 or (
                sig["direction"] in ("BUY", "SELL") and sig["confidence"] >= 70.0
            ):
                db.add(
                    QuantSignalRecord(
                        symbol=symbol,
                        timeframe=timeframe,
                        timestamp=now_utc,
                        direction=sig["direction"],
                        confidence=sig["confidence"],
                        entry_price=sig["entry"],
                        stop_loss=sig["stop_loss"],
                        take_profit=sig["take_profit"],
                        rsi_14=ind["rsi14"],
                        macd_hist=ind["macd_hist"],
                        trend_regime=sig["regime"],
                        pattern_similarity=pm["avg_similarity_pct"],
                        session_name=sig["session_current"],
                        news_blocked=sig["news_blocked"],
                        blocked_reason=sig["news_reason"],
                    )
                )

            # AUTO-DISPATCH ENGINE: Push >=75% Confidence Whitelist Signals to Account 1 & Account 5!
            min_conf = float(AUTO_DISPATCH_STATE.get("min_confidence", 75.0))
            if (
                bool(AUTO_DISPATCH_STATE.get("enabled", True))
                and symbol in WHITELIST_AUTO_PAIRS
                and sig["direction"] in ("BUY", "SELL")
                and float(sig["confidence"]) >= min_conf
                and not sig["news_blocked"]
            ):
                clean_sym = symbol.replace("/", "")
                last_map: Dict[str, float] = AUTO_DISPATCH_STATE["last_fired_epoch"]  # type: ignore
                exec_epochs: Dict[str, float] = AUTO_DISPATCH_STATE["executed_epochs"]  # type: ignore
                active_map: Dict[str, Dict] = AUTO_DISPATCH_STATE["active_signals"]  # type: ignore
                cooldown = float(AUTO_DISPATCH_STATE.get("cooldown_seconds", 480.0))
                retry_sec = float(AUTO_DISPATCH_STATE.get("unexecuted_retry_seconds", 60.0))

                last_exec_ep = exec_epochs.get(clean_sym, 0.0)
                last_fire_ep = last_map.get(clean_sym, 0.0)
                cur_active = active_map.get(clean_sym)
                already_exec = bool(cur_active and cur_active.get("executed_by"))

                # Enforce 8m anti-spam cooldown AFTER MT5 execution; otherwise re-emit every 60s so bridges never miss!
                effective_wait = cooldown if (already_exec or (now_ep - last_exec_ep) < cooldown) else retry_sec
                ref_epoch = max(last_exec_ep, last_fire_ep) if effective_wait == cooldown else last_fire_ep

                if (now_ep - ref_epoch) >= effective_wait:
                    sig_id = f"OMNI-{clean_sym}-{timeframe}-{int(now_ep)}"
                    dispatch_payload = {
                        "id": sig_id,
                        "symbol": clean_sym,
                        "ui_symbol": symbol,
                        "type": sig["direction"],
                        "status": "ACTIVE",
                        "entry": sig["entry"],
                        "sl": sig["stop_loss"],
                        "tp1": sig["tp1"],
                        "tp2": sig["tp2"],
                        "tp3": sig["take_profit"],
                        "confidence": sig["confidence"],
                        "timeframe": timeframe,
                        "regime": sig["regime"],
                        "source": "OMNIQUANT_SCALP_AI",
                        "notes": f"OMNIQUANT {timeframe} Scalp ({sig['confidence']}%)",
                        "created_at": now_utc.isoformat(),
                        "created_epoch": now_ep,
                        "expires_epoch": now_ep + 180.0,  # Valid for 3 minutes
                        "executed_by": {},
                        "mt5_status": "DISPATCHED",
                    }
                    hist_dq: Deque[Dict] = AUTO_DISPATCH_STATE["history"]  # type: ignore
                    active_map[clean_sym] = dispatch_payload
                    last_map[clean_sym] = now_ep
                    hist_dq.appendleft(dispatch_payload)

            matrix_summary[symbol] = {
                "symbol": symbol,
                "price": analysis["quote"]["price"],
                "bid": analysis["quote"]["bid"],
                "ask": analysis["quote"]["ask"],
                "spread_pips": analysis["quote"]["spread_pips"],
                "digits": analysis["quote"]["digits"],
                "change_pct": analysis["quote"]["change_pct"],
                "atr_pips": analysis["quote"]["atr_pips"],
                "rsi14": ind["rsi14"],
                "macd_hist": ind["macd_hist"],
                "vol_zscore": ind["vol_zscore"],
                "direction": sig["direction"],
                "raw_bias": sig["raw_bias"],
                "confidence": sig["confidence"],
                "entry": sig["entry"],
                "stop_loss": sig["stop_loss"],
                "take_profit": sig["take_profit"],
                "regime": sig["regime"],
                "pattern_sim": pm["avg_similarity_pct"],
                "news_blocked": sig["news_blocked"],
            }

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    CRON_TELEMETRY["status"] = "ACTIVE"
    CRON_TELEMETRY["last_sync_utc"] = now_utc.isoformat()
    CRON_TELEMETRY["sync_count"] = int(CRON_TELEMETRY["sync_count"]) + 1
    CRON_TELEMETRY["cached_matrix"] = matrix_summary
    return CRON_TELEMETRY


def get_recent_persisted_signals(limit: int = 16) -> List[Dict]:
    db = SessionLocal()
    try:
        rows = (
            db.query(QuantSignalRecord)
            .order_by(desc(QuantSignalRecord.timestamp))
            .limit(limit)
            .all()
        )
        return [
            {
                "id": r.id,
                "symbol": r.symbol,
                "timeframe": r.timeframe,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "direction": r.direction,
                "confidence": r.confidence,
                "entry_price": r.entry_price,
                "stop_loss": r.stop_loss,
                "take_profit": r.take_profit,
                "rsi_14": r.rsi_14,
                "trend_regime": r.trend_regime,
                "pattern_similarity": r.pattern_similarity,
                "session_name": r.session_name,
                "news_blocked": r.news_blocked,
            }
            for r in rows
        ]
    finally:
        db.close()


def start_background_cron(db_backend_label: str) -> None:
    global _scheduler
    settings = get_settings()
    AUTO_DISPATCH_STATE["enabled"] = settings.auto_trade_enabled
    AUTO_DISPATCH_STATE["min_confidence"] = settings.auto_trade_min_confidence
    CRON_TELEMETRY["db_backend"] = db_backend_label
    CRON_TELEMETRY["next_sync_seconds"] = settings.cron_interval_seconds

    sync_all_pairs_and_signals("M5")

    if _scheduler is None:
        _scheduler = BackgroundScheduler(timezone="UTC")
        _scheduler.add_job(
            sync_all_pairs_and_signals,
            "interval",
            seconds=settings.cron_interval_seconds,
            id="omniquant_signal_cron",
            replace_existing=True,
        )
        _scheduler.start()


def stop_background_cron() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
