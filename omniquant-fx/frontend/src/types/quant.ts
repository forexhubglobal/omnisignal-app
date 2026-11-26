export interface EnrichedCandle {
  timestamp: string;
  time_label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume: number;
  vol_zscore: number;
  ema20: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  macd_hist: number;
  rsi_norm: number;
  macd_norm: number;
  ma_norm: number;
  composite: number;
  session: string;
  signal?: "BUY" | "SELL" | null;
}

export interface PatternAnalog {
  rank: number;
  timestamp: string;
  similarity_pct: number;
  forward_pips: number;
  outcome: "BULLISH" | "BEARISH";
  projected_prices: number[];
}

export interface ManifoldNode {
  id: string;
  label: string;
  value: string;
  sub: string;
  bias: "BULL" | "BEAR" | "WARN" | "NEUTRAL";
  anchor_angle: number;
  spark?: number[];
}

export interface VolumeBucket {
  price: number;
  bull_vol: number;
  bear_vol: number;
  pct: number;
  dominant: "BULL" | "BEAR";
}

export interface ActivePairAnalysis {
  symbol: string;
  timeframe: string;
  data_source: string;
  generated_at: string;
  quote: {
    price: number;
    bid: number;
    ask: number;
    spread_pips: number;
    digits: number;
    pip: number;
    change_pct: number;
    atr_pips: number;
  };
  signal: {
    direction: string;
    raw_bias: "BULLISH" | "BEARISH";
    confidence: number;
    composite_alpha: number;
    entry: number;
    stop_loss: number;
    take_profit: number;
    risk_reward: string;
    regime: string;
    session_current: string;
    session_filter: string;
    session_allowed: boolean;
    news_blocked: boolean;
    news_reason: string;
  };
  performance: {
    net_pnl_usd: number;
    total_pips: number;
    sharpe: number;
    win_rate: number;
    profit_factor: number;
    max_drawdown_pct: number;
    hurst: number;
    r_squared: number;
    equity_filtered: number[];
    equity_unfiltered: number[];
  };
  indicators_latest: {
    rsi14: number;
    macd_line: number;
    macd_signal: number;
    macd_hist: number;
    ema20: number;
    sma50: number;
    sma200: number;
    vol_current: number;
    vol_avg20: number;
    vol_zscore: number;
    ldn_avg_vol: number;
    ny_avg_vol: number;
    asia_avg_vol: number;
  };
  distribution: {
    bins: number[];
    empirical: number[];
    gaussian: number[];
  };
  pattern_matching: {
    current_norm_window: number[];
    analogs: PatternAnalog[];
    avg_similarity_pct: number;
    bullish_prob_pct: number;
    bearish_prob_pct: number;
    fan: {
      history_prices: number[];
      p10: number[];
      p25: number[];
      p50: number[];
      p75: number[];
      p90: number[];
    };
  };
  volume_profile: VolumeBucket[];
  candles: EnrichedCandle[];
  manifold: {
    left_nodes: ManifoldNode[];
    right_nodes: ManifoldNode[];
    params: {
      energy: number;
      bull_ratio: number;
      coherence: number;
      turbulence: number;
    };
  };
}

export interface MatrixRow {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread_pips: number;
  digits: number;
  change_pct: number;
  atr_pips: number;
  rsi14: number;
  macd_hist: number;
  vol_zscore: number;
  direction: string;
  raw_bias: "BULLISH" | "BEARISH";
  confidence: number;
  entry: number;
  stop_loss: number;
  take_profit: number;
  regime: string;
  pattern_sim: number;
  news_blocked: boolean;
}

export interface EconomicEvent {
  id: string;
  timestamp: string;
  utc_hour: number;
  currency: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  forecast: string;
  previous: string;
  actual: string;
  minutes_from_now: number;
  status: string;
}

export interface TimelineTrack {
  id: string;
  label: string;
  spans: {
    start: number;
    end: number;
    kind: string;
    text: string;
  }[];
}

export interface MT5BridgeTelemetry {
  connected: boolean;
  account_login: number | null;
  broker_server: string | null;
  company?: string;
  balance: number;
  equity: number;
  currency: string;
  open_positions_count: number;
  floating_pnl: number;
  positions: {
    ticket: number;
    symbol: string;
    type: "BUY" | "SELL";
    volume: number;
    price_open: number;
    price_current: number;
    sl: number;
    tp: number;
    profit: number;
    origin: "AMATERASU_BOT" | "MANUAL";
  }[];
}

export interface GatekeeperAuditItem {
  timestamp: string;
  symbol: string;
  proposed_action: string;
  approved: boolean;
  verdict: "APPROVE" | "BOOST" | "BLOCK";
  reason_code: string;
  reason: string;
  confidence: number;
  pattern_similarity: number;
  matching_prob_pct: number;
  data_source: string;
}

export interface SyncedMT5Account {
  login: number;
  label: string;
  connected: boolean;
  trading_enabled?: boolean;
  broker_server: string;
  balance: number;
  equity: number;
  floating_pnl: number;
  currency: string;
  win_rate: number;
  realized_profit: number;
  open_positions_count: number;
  age_sec?: number | null;
  source?: string;
  positions: {
    ticket: number;
    symbol: string;
    type: "BUY" | "SELL";
    volume: number;
    price_open: number;
    price_current: number;
    sl: number;
    tp: number;
    profit: number;
    origin: string;
  }[];
}

export interface DashboardPayload {
  active: ActivePairAnalysis;
  matrix: MatrixRow[];
  mt5_bridge?: MT5BridgeTelemetry;
  synced_accounts?: SyncedMT5Account[];
  auto_dispatch?: {
    enabled: boolean;
    min_confidence: number;
    active_count: number;
    history: {
      id: string;
      symbol: string;
      type: "BUY" | "SELL";
      entry: number;
      confidence: number;
      timeframe: string;
      created_at: string;
    }[];
  };
  gatekeeper_logs?: GatekeeperAuditItem[];
  economic_calendar: {
    shield_enabled: boolean;
    status: {
      blocked: boolean;
      shield_window_minutes: number;
      reason: string;
      active_event?: EconomicEvent | null;
      next_event?: EconomicEvent | null;
    };
    events: EconomicEvent[];
  };
  timeline: {
    current_utc_hour: number;
    utc_clock: string;
    tracks: TimelineTrack[];
  };
  cron: {
    status: string;
    last_sync_utc: string | null;
    sync_count: number;
    interval_seconds: number;
    db_backend: string;
  };
  recent_signals: {
    id: number;
    symbol: string;
    timeframe: string;
    timestamp: string;
    direction: string;
    confidence: number;
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    rsi_14: number;
    trend_regime: string;
    pattern_similarity: number;
    session_name: string;
    news_blocked: boolean;
  }[];
}
