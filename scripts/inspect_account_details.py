import MetaTrader5 as mt5
import json, os
from datetime import datetime, timedelta

def inspect_acc(config_path, name):
    print("=" * 70)
    print(f"INSPECTING {name}: {config_path}")
    print("=" * 70)
    if not os.path.exists(config_path):
        print(f"Config {config_path} does not exist.")
        return

    with open(config_path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)

    path = cfg.get("mt5_terminal_path")
    login = cfg.get("mt5_login")
    password = cfg.get("mt5_password")
    server = cfg.get("mt5_server")

    init_kwargs = {}
    if path and os.path.exists(path):
        init_kwargs["path"] = path
    if login and password and server:
        init_kwargs["login"] = int(login)
        init_kwargs["password"] = str(password)
        init_kwargs["server"] = str(server)

    ok = False
    if init_kwargs:
        ok = mt5.initialize(**init_kwargs)
    if not ok and path:
        ok = mt5.initialize(path=path)
    if not ok:
        ok = mt5.initialize()

    if not ok:
        print("Failed to initialize MT5:", mt5.last_error())
        return

    acc = mt5.account_info()
    if not acc:
        print("Failed to get account info:", mt5.last_error())
        mt5.shutdown()
        return

    print(f"Login: {acc.login} | Name: {acc.name} | Currency: {acc.currency}")
    print(f"Balance: {acc.balance} | Equity: {acc.equity} | Profit: {acc.profit} | Margin: {acc.margin}")

    from_date = datetime(2025, 1, 1)
    to_date = datetime.now() + timedelta(days=2)
    deals = mt5.history_deals_get(from_date, to_date)
    if deals:
        print(f"\nTotal Deals: {len(deals)}")
        deposits = sum(d.profit for d in deals if d.type == 2 and d.profit > 0)
        withdrawals = sum(d.profit for d in deals if d.type == 2 and d.profit < 0)
        trade_deals = [d for d in deals if d.entry in (1, 3)]
        trade_profit = sum(d.profit for d in trade_deals)
        swap = sum(d.swap for d in deals)
        comm = sum(d.commission for d in deals)
        net_profit = trade_profit + swap + comm
        print(f"Deposits (Type 2 > 0): {deposits:.2f} {acc.currency}")
        print(f"Withdrawals (Type 2 < 0): {withdrawals:.2f} {acc.currency}")
        print(f"Gross Trade Profit: {trade_profit:.2f} {acc.currency}")
        print(f"Swap: {swap:.2f} | Comm: {comm:.2f}")
        print(f"Net Closed Realised Profit: {net_profit:.2f} {acc.currency}")

        print("\nLast 10 Closed Deals:")
        for d in deals[-10:]:
            t_str = datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M:%S")
            print(f"Ticket: {d.ticket} | Time: {t_str} | Sym: {d.symbol} | Type: {d.type} | Entry: {d.entry} | Vol: {d.volume} | Price: {d.price} | Profit: {d.profit} | Comm: {d.commission} | Comment: {d.comment}")
    else:
        print("No history deals found.")

    mt5.shutdown()

if __name__ == "__main__":
    inspect_acc(r"C:\AmaterasuX_Acc2\bridge_config.json", "ACCOUNT 2 (CENT #5100207348)")
    print("\n\n")
    inspect_acc(r"C:\AmaterasuX_Acc3\bridge_config.json", "ACCOUNT 3 (STANDARD #5100209626)")
