import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta

mt5.initialize()
symbol = "XAUUSD.c"
rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 50)

print(f"=== FULL M15 TIMELINE FOR {symbol} TODAY ===")
for r in rates:
    c_time = datetime.fromtimestamp(r['time'], timezone.utc).astimezone(timezone(timedelta(hours=8)))
    # print high, low, open, close, and range
    rng = r['high'] - r['low']
    direction = "BULL" if r['close'] >= r['open'] else "BEAR"
    print(f"{c_time.strftime('%H:%M')} | {direction} | O: {r['open']:.2f} | H: {r['high']:.2f} | L: {r['low']:.2f} | C: {r['close']:.2f} | Range: {rng:.2f} pts")

mt5.shutdown()
