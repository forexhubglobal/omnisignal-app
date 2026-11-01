import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta

mt5.initialize()
now_myt = datetime.now(timezone(timedelta(hours=8)))
start_today = datetime(now_myt.year, now_myt.month, now_myt.day, 12, 0, 0, tzinfo=timezone(timedelta(hours=8)))
start_utc = start_today.astimezone(timezone.utc)
end_utc = datetime.now(timezone.utc)

deals = mt5.history_deals_get(start_utc, end_utc)
print(f"Deals after 12:00 PM today: {len(deals) if deals else 0}")
if deals:
    for d in deals:
        d_time = datetime.fromtimestamp(d.time, timezone.utc).astimezone(timezone(timedelta(hours=8)))
        t_type = "BUY" if d.type == 0 else ("SELL" if d.type == 1 else str(d.type))
        entry_type = "IN" if d.entry == 0 else ("OUT" if d.entry == 1 else "INOUT")
        print(f"Deal #{d.ticket} | {d_time.strftime('%H:%M:%S')} MYT | {d.symbol} | {entry_type} | {t_type} {d.volume} lot @ {d.price} | Profit: {d.profit:+.2f} | Magic: {d.magic} | Comment: {d.comment}")

mt5.shutdown()
