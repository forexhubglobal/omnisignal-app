import MetaTrader5 as mt5
import json, os
from datetime import datetime, timedelta

def audit_terminal(cfg_path, name):
    print("=" * 80)
    print(f"AUDITING DEALS FOR: {name}")
    print("=" * 80)
    with open(cfg_path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    
    path = cfg.get("mt5_terminal_path")
    login = cfg.get("mt5_login")
    server = cfg.get("mt5_server")
    password = cfg.get("mt5_password")
    
    # Try initialize
    ok = mt5.initialize(path=path, login=int(login), password=str(password), server=str(server))
    if not ok:
        ok = mt5.initialize(path=path)
    if not ok:
        print("Failed to initialize MT5:", mt5.last_error())
        return
        
    acc = mt5.account_info()
    if not acc:
        print("Failed to get account info:", mt5.last_error())
        mt5.shutdown()
        return
        
    print(f"Account: {acc.login} | Name: {acc.name} | Currency: {acc.currency}")
    print(f"Balance: {acc.balance:,.2f} | Equity: {acc.equity:,.2f} | Profit: {acc.profit:,.2f} | Margin: {acc.margin:,.2f} | Free Margin: {acc.margin_free:,.2f}")
    
    # All deals from Nov 11 to Nov 13
    from_date = datetime(2026, 11, 11, 0, 0, 0)
    to_date = datetime(2026, 11, 13, 0, 0, 0)
    deals = mt5.history_deals_get(from_date, to_date)
    
    if deals:
        print(f"\nTotal Deals in range: {len(deals)}")
        # Filter for deals today
        deals_today = [d for d in deals if datetime.fromtimestamp(d.time).day == 12]
        print(f"Deals Today (Nov 12): {len(deals_today)}")
        
        # Sort by time
        deals_today.sort(key=lambda x: x.time)
        for d in deals_today:
            t_str = datetime.fromtimestamp(d.time).strftime('%Y-%m-%d %H:%M:%S')
            d_type = "BUY" if d.type == 0 else ("SELL" if d.type == 1 else f"TYPE_{d.type}")
            entry = "IN" if d.entry == 0 else ("OUT" if d.entry == 1 else f"ENTRY_{d.entry}")
            print(f"[{t_str}] Ticket: {d.ticket} | Order: {d.order} | {d.symbol} {d_type} {entry} | Vol: {d.volume} | Price: {d.price} | Profit: {d.profit:,.2f} | Comm: {d.commission:.2f} | Comment: '{d.comment}'")
    else:
        print("No deals found in date range.")
        
    mt5.shutdown()
    print("\n")

if __name__ == "__main__":
    audit_terminal(r"C:\AmaterasuX\bridge_config.json", "ACCOUNT 1 (CENT #5100154135)")
    audit_terminal(r"C:\AmaterasuX_Acc2\bridge_config.json", "ACCOUNT 2 (CENT #5100207348)")
    audit_terminal(r"C:\AmaterasuX_Acc3\bridge_config.json", "ACCOUNT 3 (STANDARD #5100209626)")
