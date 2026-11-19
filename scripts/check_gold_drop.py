import MetaTrader5 as mt5
from datetime import datetime

term_path = r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
mt5.initialize(path=term_path)

sym = "XAUUSD"
if not mt5.symbol_select(sym, True):
    sym = "XAUUSD.c"
    mt5.symbol_select(sym, True)

print("Symbol selected:", sym)
tick = mt5.symbol_info_tick(sym)
if tick:
    print(f"Current Tick: Bid={tick.bid}, Ask={tick.ask}, Time={datetime.fromtimestamp(tick.time)}")

rates_h1 = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_H1, 0, 24)
if rates_h1 is not None and len(rates_h1) > 0:
    print("\n--- H1 BARS TODAY ---")
    for r in rates_h1[-16:]:
        t_str = datetime.fromtimestamp(r['time']).strftime('%Y-%m-%d %H:%M')
        print(f"Time: {t_str} | O: {r['open']:.2f} | H: {r['high']:.2f} | L: {r['low']:.2f} | C: {r['close']:.2f}")

rates_m15 = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_M15, 0, 40)
if rates_m15 is not None and len(rates_m15) > 0:
    print("\n--- M15 BARS TODAY (RECENT) ---")
    for r in rates_m15[-20:]:
        t_str = datetime.fromtimestamp(r['time']).strftime('%Y-%m-%d %H:%M')
        print(f"Time: {t_str} | O: {r['open']:.2f} | H: {r['high']:.2f} | L: {r['low']:.2f} | C: {r['close']:.2f}")

mt5.shutdown()
