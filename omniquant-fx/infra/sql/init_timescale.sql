-- OMNIQUANT FX - TimescaleDB Schema Initialization
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS ohlcv_candles (
    symbol VARCHAR(16) NOT NULL,
    timeframe VARCHAR(8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    tick_volume DOUBLE PRECISION NOT NULL,
    source VARCHAR(32) DEFAULT 'simulator',
    PRIMARY KEY (symbol, timeframe, timestamp)
);

SELECT create_hypertable('ohlcv_candles', 'timestamp', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_candles_symbol_tf_time
    ON ohlcv_candles (symbol, timeframe, timestamp DESC);

CREATE TABLE IF NOT EXISTS quant_signals (
    id BIGSERIAL,
    symbol VARCHAR(16) NOT NULL,
    timeframe VARCHAR(8) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    direction VARCHAR(16) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    entry_price DOUBLE PRECISION NOT NULL,
    stop_loss DOUBLE PRECISION NOT NULL,
    take_profit DOUBLE PRECISION NOT NULL,
    rsi_14 DOUBLE PRECISION NOT NULL,
    macd_hist DOUBLE PRECISION NOT NULL,
    trend_regime VARCHAR(32) NOT NULL,
    pattern_similarity DOUBLE PRECISION NOT NULL,
    session_name VARCHAR(32) NOT NULL,
    news_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    PRIMARY KEY (id, timestamp)
);

SELECT create_hypertable('quant_signals', 'timestamp', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_signals_symbol_time
    ON quant_signals (symbol, timestamp DESC);
