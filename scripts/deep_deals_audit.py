import MetaTrader5 as mt5
import json, os
from datetime import datetime, timedelta

configs = [
    (r"C:\AmaterasuX\bridge_config.json", "ACCOUNT 1 (CENT #5100154135)"),
    (r"C:\AmaterasuX_Acc2\bridge_config.json", "ACCOUNT 2 (CENT #5100207348)"),
    (r"C:\AmaterasuX_Acc3\bridge_config.json", "ACCOUNT 3 (STANDARD #5100209626)")
]

for cfg_path, name in configs:
    print("=" * 80)
    print(f"AUDITING: {name}")
    print("=" * 80)
    if not os.path.exists(cfg_path):
        print("Config not found:", cfg_path)
        continue
    with open(cfg_path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    
    path = cfg.get("mt5_terminal_path")
    login = cfg.get("mt5_login")
    server = cfg.get("mt5_server")
    password = cfg.get("mt5_password")
    
    init_kwargs = {}
    if path and os.path.exists(path):
        init_kwargs["path"] = path
    if "VersusTrade_Acc" in (path or ''):
        init_kwargs["portable"] = True
    if login and password and server:
        init_kwargs["login"] = int(login)
        init_kwargs["password"] = str(password)
        init_kwargs["server"] = str(server)
        
    ok = mt5.initialize(**init_kwargs)
    if not ok:
        ok = mt5.initialize(path=path)
    if not ok:
        print("Init failed:", mt5.last_error())
        continue
        
    acc = mt5.account_info()
    if not acc:
        print("Account info failed:", mt5.last_error())
        mt5.shutdown()
        continue
        
    print(f"Login: {acc.login} | Currency: {acc.currency}")
    print(f"Balance: {acc.balance:,.2f} | Equity: {acc.equity:,.2f} | Margin: {acc.margin:,.2f} | Free Margin: {acc.margin_free:,.2f}")
    
    open_positions = mt5.positions_get()
    print(f"Open Positions: {len(open_positions) if open_positions else 0}")
    if open_positions:
        for p in open_positions:
            print(f"  [OPEN] Ticket {p.ticket}: {p.symbol} {'BUY' if p.type==0 else 'SELL'} vol={p.volume} open={p.price_open} sl={p.sl} tp={p.tp} profit={p.profit}")
            
    # History deals today (from midnight Nov 12)
    today = datetime(2026, 11, 12, 0, 0, 0)
    end_time = datetime.now() + timedelta(days=1)
    deals = mt5.history_deals_get(today, end_time)
    if deals:
        print(f"\nDeals Today ({len(deals)} total):")
        total_pnl = 0.0
        closed_trades = []
        for d in deals:
            deal_time = datetime.fromtimestamp(d.time).strftime('%H:%M:%S')
            deal_type_str = "BUY" if d.type == 0 else ("SELL" if d.type == 1 else f"TYPE_{d.type}")
            entry_str = "IN" if d.entry == 0 else ("OUT" if d.entry == 1 else ("IN/OUT" if d.entry == 2 else f"ENTRY_{d.entry}"))
            if d.entry in [1, 2]: # closing deal
                total_pnl += d.profit + d.swap + d.commission
                closed_trades.append(d)
                print(f"  [CLOSED DEAL] Time: {deal_time} | Ticket: {d.ticket} | Order: {d.order} | {d.symbol} {deal_type_str} | vol: {d.volume} | price: {d.price} | profit: {d.profit:,.2f} | comm: {d.commission:.2f} | comment: {d.comment}")
        print(f"Total Net PnL Today: {total_pnl:,.2f} {acc.currency}")
    else:
        print("No deals found today.")
        
    mt5.shutdown()
    print("\n")
