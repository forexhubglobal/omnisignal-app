import MetaTrader5 as mt5

mt5.initialize()
positions = mt5.positions_get()
print(f"Total open positions right now: {len(positions) if positions else 0}")
symbols = {}
if positions:
    for p in positions:
        sym = p.symbol
        symbols[sym] = symbols.get(sym, 0) + 1
        t_type = "BUY" if p.type == 0 else "SELL"
        print(f"Ticket #{p.ticket} | {sym} | {t_type} {p.volume} lot | Open: {p.price_open} | Cur: {p.price_current} | Profit: {p.profit:+.2f} | Magic: {p.magic}")
print("\nBreakdown by symbol:", symbols)
mt5.shutdown()
