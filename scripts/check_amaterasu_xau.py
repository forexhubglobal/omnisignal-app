import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta

mt5.initialize()
now_myt = datetime.now(timezone(timedelta(hours=8)))
start_today = datetime(now_myt.year, now_myt.month, now_myt.day, 0, 0, 0, tzinfo=timezone(timedelta(hours=8)))
start_utc = start_today.astimezone(timezone.utc)
end_utc = datetime.now(timezone.utc)

deals = mt5.history_deals_get(start_utc, end_utc)
xau_deals = [d for d in deals if "XAU" in d.symbol.upper() or "GOLD" in d.symbol.upper()]

print("=== ALL AMATERASU X (MAGIC 888999) DEALS FOR XAUUSD TODAY ===")
amaterasu_deals = [d for d in xau_deals if d.magic == 888999]
for d in amaterasu_deals:
    d_time = datetime.fromtimestamp(d.time, timezone.utc).astimezone(timezone(timedelta(hours=8)))
    t_type = "BUY" if d.type == 0 else ("SELL" if d.type == 1 else str(d.type))
    entry_type = "IN" if d.entry == 0 else ("OUT" if d.entry == 1 else "INOUT")
    print(f"Deal #{d.ticket} | Order #{d.order} | {d_time.strftime('%H:%M:%S')} MYT | {entry_type} | {t_type} {d.volume} lot @ {d.price} | Profit: {d.profit:+.2f} | Comment: {d.comment}")

print(f"\nTotal Amaterasu XAU deals: {len(amaterasu_deals)}")
closed_amaterasu_xau = [d for d in amaterasu_deals if d.entry == 1]
print(f"Total closed Amaterasu XAU deals: {len(closed_amaterasu_xau)}")
total_pnl = sum(d.profit for d in closed_amaterasu_xau)
print(f"Total Net PnL Amaterasu XAU: {total_pnl:+.2f}")

# Also check all non-magic (manual or other) deals
print("\n=== ALL OTHER DEALS (MAGIC 0) FOR XAUUSD TODAY ===")
other_deals = [d for d in xau_deals if d.magic != 888999]
closed_other = [d for d in other_deals if d.entry == 1]
print(f"Total closed other XAU deals: {len(closed_other)}")
total_other_pnl = sum(d.profit for d in closed_other)
print(f"Total Net PnL Other XAU: {total_other_pnl:+.2f}")

mt5.shutdown()
