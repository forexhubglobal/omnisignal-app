from datetime import datetime, timezone
from typing import Dict, List
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import desc
from app.adapters.economic_calendar import evaluate_news_shield, fetch_economic_calendar
from app.adapters.forex_feed import get_forex_candles
from app.config import get_settings
from app.database import OHLCVCandle, QuantSignalRecord, SessionLocal
from app.quant.engine import analyze_pair

CRON_TELEMETRY: Dict[str, object] = {
    "status": "INITIALIZING",
    "last_sync_utc": None,
    "next_sync_seconds": 60,
    "sync_count": 0,
    "db_backend": "SQLite (Local Embedded)",
    "cached_matrix": {},
}

_scheduler: BackgroundScheduler | None = None


def sync_all_pairs_and_signals(timeframe: str = "M15") -> Dict[str, object]:
    """
    Periodic Cron Task:
    1. Pulls latest OHLCV + Tick Volume candles for all tracked pairs
    2. Persists recent candles into TimescaleDB / SQLite
    3. Evaluates Economic Calendar News Shield + London/NY Session Filter
    4. Synthesizes Quantitative Signals and logs to `quant_signals` hypertable
    """
    settings = get_settings()
    now_utc = datetime.now(timezone.utc)
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

            # Upsert latest 8 candles for historical persistence
            for c in candles[-8:]:
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
    CRON_TELEMETRY["db_backend"] = db_backend_label
    CRON_TELEMETRY["next_sync_seconds"] = settings.cron_interval_seconds

    sync_all_pairs_and_signals("M15")

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
