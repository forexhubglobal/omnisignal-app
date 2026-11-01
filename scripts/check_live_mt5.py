import MetaTrader5 as mt5
from datetime import datetime, timedelta

if not mt5.initialize():
    print("MT5 Init Failed")
    exit()

acc = mt5.account_info()
print(f"ACCOUNT: #{acc.login} | Balance: {acc.balance:.2f} USC | Equity: {acc.equity:.2f} USC | Margin: {acc.margin:.2f}")

positions = mt5.positions_get()
print("\n=== ACTIVE POSITIONS ===")
if positions:
    for p in positions:
        typ = "BUY" if p.type == mt5.POSITION_TYPE_BUY else "SELL"
        print(f"#{p.ticket} {p.symbol} {typ} {p.volume} @ {p.price_open} | Cur: {p.price_current} | SL: {p.sl} | TP: {p.tp} | Profit: {p.profit:.2f} USC | Comment: {p.comment}")
else:
    print("No open positions.")

now = datetime.now()
deals = mt5.history_deals_get(now - timedelta(hours=3), now)
print("\n=== RECENT CLOSED DEALS (LAST 3 HOURS) ===")
if deals:
    for d in deals:
        if d.entry == 1:
            typ = "BUY" if d.type == mt5.DEAL_TYPE_BUY else "SELL"
            print(f"Deal #{d.ticket} Pos #{d.position_id} {d.symbol} {typ} Vol: {d.volume} @ {d.price} | Profit: {d.profit:.2f} USC | Comment: {d.comment}")
else:
    print("No closed deals.")

mt5.shutdown()
