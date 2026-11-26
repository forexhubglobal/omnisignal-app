from datetime import datetime, timezone
import hashlib
import math
import time
from typing import Dict, List, Optional, Tuple
import httpx
import numpy as np
from app.adapters.mt5_live import fetch_mt5_candles_and_quote
from app.config import get_settings

PAIR_SPECS: Dict[str, Dict[str, float]] = {
    "XAU/USD": {"anchor": 3575.50, "pip": 0.10, "spread_pips": 2.2, "vol": 0.0018, "digits": 2},
    "USD/CHF": {"anchor": 0.8310, "pip": 0.0001, "spread_pips": 0.9, "vol": 0.00072, "digits": 5},
    "EUR/USD": {"anchor": 1.0584, "pip": 0.0001, "spread_pips": 0.8, "vol": 0.00075, "digits": 5},
    "GBP/USD": {"anchor": 1.2672, "pip": 0.0001, "spread_pips": 1.1, "vol": 0.00088, "digits": 5},
    "USD/JPY": {"anchor": 151.420, "pip": 0.01, "spread_pips": 0.9, "vol": 0.00085, "digits": 3},
}

YAHOO_TICKERS: Dict[str, Tuple[str, str]] = {
    "XAU/USD": ("GC=F", "DIRECT"),
    "USD/CHF": ("CHF=X", "DIRECT"),
    "EUR/USD": ("EURUSD=X", "DIRECT"),
    "GBP/USD": ("GBPUSD=X", "DIRECT"),
    "USD/JPY": ("JPY=X", "DIRECT"),
}

PUBLIC_SPOT_CACHE: Dict[Tuple[str, str], Tuple[float, List[Dict], str]] = {}

TF_MINUTES: Dict[str, int] = {
    "M5": 5,
    "M15": 15,
    "H1": 60,
    "H4": 240,
}

TWELVEDATA_INTERVALS: Dict[str, str] = {
    "M5": "5min",
    "M15": "15min",
    "H1": "1h",
    "H4": "4h",
}

OANDA_GRANULARITY: Dict[str, str] = {
    "M5": "M5",
    "M15": "M15",
    "H1": "H1",
    "H4": "H4",
}

LIVE_MT5_QUOTES: Dict[str, Dict] = {}


def normalize_ui_symbol(raw_symbol: str) -> str:
    clean = raw_symbol.split(".")[0].replace("_", "").replace("/", "").upper().strip()
    if clean in ("GOLD", "XAUUSD", "XAUUSDM"):
        return "XAU/USD"
    if len(clean) >= 6:
        base = clean[:3]
        quote = clean[3:6]
        return f"{base}/{quote}"
    return raw_symbol.upper()


def session_multiplier(utc_hour: int) -> float:
    if 13 <= utc_hour < 17:
        return 2.65
    if 8 <= utc_hour < 13:
        return 1.85
    if 17 <= utc_hour < 21:
        return 1.45
    if 0 <= utc_hour < 7:
        return 0.85
    return 0.55


def classify_utc_session(dt_utc: datetime) -> Dict[str, object]:
    h = dt_utc.hour
    in_london = 8 <= h < 17
    in_ny = 13 <= h < 22
    in_tokyo = 0 <= h < 9
    # Amaterasu X SOP: London Trap Zone 14:00 - 16:00 MYT == 06:00 - 08:00 UTC
    london_trap = 6 <= h < 8
    if in_london and in_ny:
        name = "LDN/NY OVERLAP"
    elif in_london:
        name = "LONDON"
    elif in_ny:
        name = "NEW YORK"
    elif london_trap:
        name = "LDN TRAP ZONE"
    elif in_tokyo:
        name = "TOKYO / ASIA"
    else:
        name = "SYDNEY / ROLLOVER"
    return {
        "name": name,
        "london_active": in_london,
        "ny_active": in_ny,
        "overlap_active": in_london and in_ny,
        "tokyo_active": in_tokyo,
        "london_trap_zone": london_trap,
    }


def _seed_for_pair_tf(symbol: str, timeframe: str) -> int:
    digest = hashlib.sha256(f"OMNIQUANT::{symbol}::{timeframe}".encode()).hexdigest()
    return int(digest[:8], 16)


def generate_simulated_candles(symbol: str, timeframe: str, count: int = 420) -> List[Dict]:
    spec = PAIR_SPECS.get(symbol, PAIR_SPECS["XAU/USD"])
    tf_min = TF_MINUTES.get(timeframe, 15)
    now_utc = datetime.now(timezone.utc)
    aligned_minute = (now_utc.minute // tf_min) * tf_min
    end_ts = now_utc.replace(minute=aligned_minute, second=0, microsecond=0)

    base_seed = _seed_for_pair_tf(symbol, timeframe)
    candles: List[Dict] = []
    price = spec["anchor"] * 0.988

    motif = np.array([
        -0.35, -0.25, -0.40, -0.15, 0.10, 0.35, 0.55, 0.28, -0.12, 0.22, 0.65, 0.85,
        0.70, 0.45, 0.92, 1.15, 0.95, 1.25, 1.55, 1.35, 1.72, 1.90, 2.15, 2.40
    ])

    start_epoch_bars = int(end_ts.timestamp() // (tf_min * 60)) - count + 1

    for idx in range(count):
        bar_index = start_epoch_bars + idx
        ts = datetime.fromtimestamp(bar_index * tf_min * 60, tz=timezone.utc)
        rng = np.random.default_rng((base_seed + bar_index * 2654435761) & 0xFFFFFFFF)

        sess_mult = session_multiplier(ts.hour)
        tf_scale = math.sqrt(tf_min / 15.0)
        sigma = spec["vol"] * tf_scale * (0.65 + 0.45 * sess_mult)

        macro_wave = (
            0.22 * math.sin(bar_index / 29.0 + (base_seed % 7))
            + 0.14 * math.cos(bar_index / 13.0)
        )
        motif_pos = bar_index % 96
        motif_impulse = 0.0
        if motif_pos < len(motif):
            diff = motif[motif_pos] - (motif[motif_pos - 1] if motif_pos > 0 else 0.0)
            motif_impulse = diff * 0.55

        ret = (macro_wave * 0.12 + motif_impulse * 0.38 + rng.normal(0, 1.0) * 0.72) * sigma
        open_p = price
        close_p = max(spec["pip"] * 50, open_p * (1.0 + ret))

        body = abs(close_p - open_p)
        upper_wick = abs(rng.normal(0.45, 0.30)) * price * sigma + body * 0.25
        lower_wick = abs(rng.normal(0.45, 0.30)) * price * sigma + body * 0.25
        high_p = max(open_p, close_p) + upper_wick
        low_p = min(open_p, close_p) - lower_wick

        displacement_ratio = min(3.5, abs(ret) / max(1e-8, sigma))
        base_ticks = 820.0 * (tf_min / 15.0)
        tick_vol = max(
            95.0,
            base_ticks * sess_mult * (0.65 + 0.58 * displacement_ratio + abs(rng.normal(0, 0.18))),
        )

        if idx == count - 1:
            sec_phase = (now_utc.second + now_utc.microsecond / 1e6) / 60.0
            live_nudge = math.sin(sec_phase * math.pi * 2.0) * spec["pip"] * 2.2
            close_p += live_nudge
            high_p = max(high_p, close_p)
            low_p = min(low_p, close_p)

        digits = int(spec["digits"])
        candles.append(
            {
                "symbol": symbol,
                "timeframe": timeframe,
                "timestamp": ts.isoformat(),
                "open": round(open_p, digits),
                "high": round(high_p, digits),
                "low": round(low_p, digits),
                "close": round(close_p, digits),
                "tick_volume": round(tick_vol, 0),
                "source": "quant_simulator",
            }
        )
        price = close_p

    return candles


def fetch_twelvedata_candles(symbol: str, timeframe: str, count: int, api_key: str) -> List[Dict]:
    interval = TWELVEDATA_INTERVALS.get(timeframe, "15min")
    url = "https://api.twelvedata.com/time_series"
    params = {
        "symbol": symbol,
        "interval": interval,
        "outputsize": min(count, 500),
        "timezone": "UTC",
        "apikey": api_key,
    }
    with httpx.Client(timeout=8.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        payload = resp.json()

    values = payload.get("values")
    if not values:
        raise ValueError(f"TwelveData error: {payload.get('message', 'no values')}")

    candles: List[Dict] = []
    for row in reversed(values):
        dt = datetime.fromisoformat(row["datetime"].replace(" ", "T")).replace(tzinfo=timezone.utc)
        vol = float(row.get("volume") or 0.0)
        if vol <= 0:
            rng_pips = abs(float(row["high"]) - float(row["low"])) / PAIR_SPECS.get(symbol, PAIR_SPECS["EUR/USD"])["pip"]
            vol = round((320.0 + rng_pips * 28.0) * session_multiplier(dt.hour), 0)
        candles.append(
            {
                "symbol": symbol,
                "timeframe": timeframe,
                "timestamp": dt.isoformat(),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "tick_volume": vol,
                "source": "twelvedata",
            }
        )
    return candles


def fetch_oanda_candles(symbol: str, timeframe: str, count: int, api_key: str, env: str = "practice") -> List[Dict]:
    instrument = symbol.replace("/", "_")
    granularity = OANDA_GRANULARITY.get(timeframe, "M15")
    host = "https://api-fxtrade.oanda.com" if env == "live" else "https://api-fxpractice.oanda.com"
    url = f"{host}/v3/instruments/{instrument}/candles"
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {"count": min(count, 500), "granularity": granularity, "price": "M"}

    with httpx.Client(timeout=8.0) as client:
        resp = client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        payload = resp.json()

    candles: List[Dict] = []
    for c in payload.get("candles", []):
        mid = c.get("mid", {})
        ts_raw = c["time"].split(".")[0].replace("Z", "")
        dt = datetime.fromisoformat(ts_raw).replace(tzinfo=timezone.utc)
        candles.append(
            {
                "symbol": symbol,
                "timeframe": timeframe,
                "timestamp": dt.isoformat(),
                "open": float(mid["o"]),
                "high": float(mid["h"]),
                "low": float(mid["l"]),
                "close": float(mid["c"]),
                "tick_volume": float(c.get("volume", 500)),
                "source": "oanda_v20",
            }
        )
    return candles


def get_live_mt5_quote(symbol: str) -> Optional[Dict]:
    return LIVE_MT5_QUOTES.get(symbol)


def fetch_public_live_spot_candles(symbol: str, timeframe: str, count: int = 420) -> Optional[Tuple[List[Dict], str]]:
    """
    Zero-key live market fallback (Binance PAXG spot Gold + Yahoo Finance FX)
    cached for 25s so even if MT5 is closed, prices are 100% real-time market levels.
    """
    cache_key = (symbol, timeframe)
    now_m = time.monotonic()
    cached = PUBLIC_SPOT_CACHE.get(cache_key)
    if cached and (now_m - cached[0]) < 25.0:
        return cached[1], cached[2]

    spec = PAIR_SPECS.get(symbol, PAIR_SPECS["XAU/USD"])
    digits = int(spec["digits"])

    # 1. Spot Gold via Binance PAXGUSDT (tracks spot XAU/USD closely 24/7)
    if symbol == "XAU/USD":
        b_int = {"M5": "5m", "M15": "15m", "H1": "1h", "H4": "4h"}.get(timeframe, "15m")
        try:
            with httpx.Client(timeout=4.5) as client:
                r = client.get(
                    "https://api.binance.com/api/v3/klines",
                    params={"symbol": "PAXGUSDT", "interval": b_int, "limit": min(count, 450)},
                )
                if r.status_code == 200:
                    rows = r.json()
                    if isinstance(rows, list) and len(rows) >= 80:
                        candles = []
                        for k in rows:
                            dt = datetime.fromtimestamp(int(k[0]) / 1000.0, tz=timezone.utc)
                            candles.append(
                                {
                                    "symbol": symbol,
                                    "timeframe": timeframe,
                                    "timestamp": dt.isoformat(),
                                    "open": round(float(k[1]), digits),
                                    "high": round(float(k[2]), digits),
                                    "low": round(float(k[3]), digits),
                                    "close": round(float(k[4]), digits),
                                    "tick_volume": max(80.0, round(float(k[8]), 0)),  # k[8] = number of trades (ticks!)
                                    "source": "public_spot_live",
                                }
                            )
                        PUBLIC_SPOT_CACHE[cache_key] = (now_m, candles, "PUBLIC SPOT GOLD LIVE")
                        return candles, "PUBLIC SPOT GOLD LIVE"
        except Exception:
            pass

    # 2. Yahoo Finance FX / Gold Chart API
    y_entry = YAHOO_TICKERS.get(symbol)
    if y_entry:
        ticker = y_entry[0]
        y_int, y_rng = {
            "M5": ("5m", "5d"),
            "M15": ("15m", "1mo"),
            "H1": ("60m", "3mo"),
            "H4": ("60m", "6mo"),
        }.get(timeframe, ("15m", "1mo"))
        try:
            with httpx.Client(timeout=5.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
                r = client.get(
                    f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}",
                    params={"interval": y_int, "range": y_rng},
                )
                if r.status_code == 200:
                    res = r.json()["chart"]["result"][0]
                    ts_list = res.get("timestamp") or []
                    q = res["indicators"]["quote"][0]
                    candles = []
                    for idx, ts_val in enumerate(ts_list):
                        o, h, l, c = q["open"][idx], q["high"][idx], q["low"][idx], q["close"][idx]
                        if None in (o, h, l, c):
                            continue
                        dt = datetime.fromtimestamp(int(ts_val), tz=timezone.utc)
                        vol = float(q["volume"][idx] or 0.0)
                        if vol <= 0:
                            rng_pips = abs(float(h) - float(l)) / max(spec["pip"], 1e-8)
                            vol = round((280.0 + rng_pips * 26.0) * session_multiplier(dt.hour), 0)
                        candles.append(
                            {
                                "symbol": symbol,
                                "timeframe": timeframe,
                                "timestamp": dt.isoformat(),
                                "open": round(float(o), digits),
                                "high": round(float(h), digits),
                                "low": round(float(l), digits),
                                "close": round(float(c), digits),
                                "tick_volume": vol,
                                "source": "yahoo_fx_live",
                            }
                        )
                    if len(candles) >= 80:
                        sliced = candles[-count:]
                        PUBLIC_SPOT_CACHE[cache_key] = (now_m, sliced, "GLOBAL FX SPOT LIVE")
                        return sliced, "GLOBAL FX SPOT LIVE"
        except Exception:
            pass

    return None


def get_forex_candles(symbol: str, timeframe: str = "M15", count: int = 420) -> Tuple[List[Dict], str]:
    """
    Priority Chain:
    1. Live MetaTrader 5 Broker Terminal (VersusTrade / Exness — Real Broker Tick Volume & Spread)
    2. TwelveData API (if configured)
    3. OANDA v20 API (if configured)
    4. Public Global Spot Feed (PAXG / Yahoo FX — 100% real-time market price without API key)
    5. Hybrid Institutional Quant Simulator (offline air-gapped fallback)
    """
    settings = get_settings()
    provider = settings.price_provider.lower()
    norm_sym = normalize_ui_symbol(symbol)

    if provider in ("auto", "mt5"):
        try:
            mt5_res = fetch_mt5_candles_and_quote(norm_sym, timeframe, count)
            if mt5_res is not None:
                candles, live_quote, server_label = mt5_res
                LIVE_MT5_QUOTES[norm_sym] = live_quote
                return candles, server_label
        except Exception:
            pass

    if provider in ("auto", "twelvedata") and settings.twelvedata_api_key:
        try:
            return fetch_twelvedata_candles(norm_sym, timeframe, count, settings.twelvedata_api_key), "TWELVEDATA LIVE"
        except Exception:
            pass

    if provider in ("auto", "oanda") and settings.oanda_api_key:
        try:
            return (
                fetch_oanda_candles(norm_sym, timeframe, count, settings.oanda_api_key, settings.oanda_env),
                "OANDA v20 LIVE",
            )
        except Exception:
            pass

    if provider != "simulator":
        pub_res = fetch_public_live_spot_candles(norm_sym, timeframe, count)
        if pub_res is not None:
            return pub_res

    return generate_simulated_candles(norm_sym, timeframe, count), "HYBRID QUANT SIMULATOR"
