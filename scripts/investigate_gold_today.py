import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta

if not mt5.initialize():
    print("Failed to initialize MT5")
    exit()

now_myt = datetime.now(timezone(timedelta(hours=8)))
start_today = datetime(now_myt.year, now_myt.month, now_myt.day, 0, 0, 0, tzinfo=timezone(timedelta(hours=8)))
start_utc = start_today.astimezone(timezone.utc)
end_utc = datetime.now(timezone.utc)

deals = mt5.history_deals_get(start_utc, end_utc)
print(f"Current MYT Time: {now_myt.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Total deals today: {len(deals) if deals else 0}")

if deals:
    xau_deals = [d for d in deals if "XAU" in d.symbol.upper() or "GOLD" in d.symbol.upper()]
    print(f"Total XAU deals today: {len(xau_deals)}")
    
    total_xau_profit = sum(d.profit for d in xau_deals)
    print(f"Total XAU Profit/Loss: {total_xau_profit:.2f}")
    
    for d in xau_deals:
        d_time = datetime.fromtimestamp(d.time, timezone.utc).astimezone(timezone(timedelta(hours=8)))
        t_type = "BUY" if d.type == 0 else ("SELL" if d.type == 1 else str(d.type))
        entry_type = "ENTRY_IN" if d.entry == 0 else ("ENTRY_OUT" if d.entry == 1 else "ENTRY_INOUT")
        print(f"Deal #{d.ticket} | Order #{d.order} | {d_time.strftime('%H:%M:%S')} MYT | {entry_type} | {t_type} {d.volume} lot @ {d.price} | Profit: {d.profit:+.2f} | Magic: {d.magic} | Comment: {d.comment}")

# Check current running positions for XAUUSD
positions = mt5.positions_get()
if positions:
    print("\n=== CURRENT RUNNING POSITIONS ===")
    for p in positions:
        if "XAU" in p.symbol.upper() or "GOLD" in p.symbol.upper():
            p_time = datetime.fromtimestamp(p.time, timezone.utc).astimezone(timezone(timedelta(hours=8)))
            t_type = "BUY" if p.type == 0 else "SELL"
            print(f"Pos #{p.ticket} | {p_time.strftime('%H:%M:%S')} MYT | {t_type} {p.volume} lot @ {p.price_open} | SL: {p.sl} | TP: {p.tp} | Current: {p.price_current} | Profit: {p.profit:+.2f} | Magic: {p.magic} | Comment: {p.comment}")

# Check XAUUSD price action today (High, Low, Open, Current, M15 candles)
symbol = "XAUUSD.c"
if not mt5.symbol_select(symbol, True):
    # Try finding symbol
    for s in mt5.symbols_get():
        if "XAU" in s.name.upper() or "GOLD" in s.name.upper():
            symbol = s.name
            break

rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 40)
if rates is not None and len(rates) > 0:
    print(f"\n=== RECENT M15 CANDLES FOR {symbol} ===")
    for r in rates[-15:]:
        c_time = datetime.fromtimestamp(r['time'], timezone.utc).astimezone(timezone(timedelta(hours=8)))
        print(f"{c_time.strftime('%H:%M')} | O: {r['open']:.2f} | H: {r['high']:.2f} | L: {r['low']:.2f} | C: {r['close']:.2f} | Vol: {r['tick_volume']}")

mt5.shutdown()
