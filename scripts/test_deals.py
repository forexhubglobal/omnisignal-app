import MetaTrader5 as mt5
import json
from datetime import datetime, timedelta

with open(r"C:\AmaterasuX_Acc3\bridge_config.json") as f:
    cfg = json.load(f)

mt5.initialize(path=cfg["mt5_terminal_path"], login=cfg["mt5_login"], password=cfg["mt5_password"], server=cfg["mt5_server"])

print("Account 3 Info:", mt5.account_info().login, mt5.account_info().currency, "Balance:", mt5.account_info().balance)

# Try different ways of querying deals
now = datetime.now()
d1 = mt5.history_deals_get(now - timedelta(days=7), now + timedelta(days=1))
print("Deals last 7 days:", len(d1) if d1 else None, "Error:", mt5.last_error())

# Try from timestamp 0
d2 = mt5.history_deals_get(0, int(now.timestamp()) + 86400)
print("Deals from ts 0:", len(d2) if d2 else None, "Error:", mt5.last_error())

# Try orders
o1 = mt5.history_orders_get(now - timedelta(days=7), now + timedelta(days=1))
print("Orders last 7 days:", len(o1) if o1 else None)

if d1:
    for d in d1[-10:]:
        print(f"Deal {d.ticket}: sym={d.symbol}, type={d.type}, entry={d.entry}, profit={d.profit}, comm={d.commission}, comment={d.comment}, time={datetime.fromtimestamp(d.time)}")

mt5.shutdown()
