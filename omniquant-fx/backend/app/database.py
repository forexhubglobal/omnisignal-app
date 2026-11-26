from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class OHLCVCandle(Base):
    __tablename__ = "ohlcv_candles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(16), nullable=False, index=True)
    timeframe = Column(String(8), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    tick_volume = Column(Float, nullable=False)
    source = Column(String(32), default="simulator")

    __table_args__ = (
        UniqueConstraint("symbol", "timeframe", "timestamp", name="uq_candle_sym_tf_ts"),
    )


class QuantSignalRecord(Base):
    __tablename__ = "quant_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(16), nullable=False, index=True)
    timeframe = Column(String(8), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    direction = Column(String(16), nullable=False)
    confidence = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    take_profit = Column(Float, nullable=False)
    rsi_14 = Column(Float, nullable=False)
    macd_hist = Column(Float, nullable=False)
    trend_regime = Column(String(32), nullable=False)
    pattern_similarity = Column(Float, nullable=False)
    session_name = Column(String(32), nullable=False)
    news_blocked = Column(Boolean, default=False)
    blocked_reason = Column(Text, nullable=True)


def init_db() -> str:
    """Create tables and enable TimescaleDB hypertables when running on PostgreSQL."""
    Base.metadata.create_all(bind=engine)
    db_backend = "SQLite (Local Embedded)"
    if not settings.database_url.startswith("sqlite"):
        db_backend = "PostgreSQL"
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
                conn.execute(
                    text("SELECT create_hypertable('ohlcv_candles', 'timestamp', if_not_exists => TRUE);")
                )
                conn.execute(
                    text("SELECT create_hypertable('quant_signals', 'timestamp', if_not_exists => TRUE);")
                )
                db_backend = "TimescaleDB Hypertable"
        except Exception:
            db_backend = "PostgreSQL Standard"
    return db_backend
