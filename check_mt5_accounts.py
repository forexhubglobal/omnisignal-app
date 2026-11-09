import MetaTrader5 as mt5

terminals = [
    ("Master 1 (5100154135 - Cent)", r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe", 5100154135, "4e364w!L", "VersusTrade-Live1"),
    ("Master 2 (5100207348 - Cent)", r"C:\VersusTrade_Acc2\terminal64.exe", 5100207348, "mfd2e!3V", "VersusTrade-Live1"),
    ("Master 3 (5100209626 - Standard)", r"C:\VersusTrade_Acc3\terminal64.exe", 5100209626, "5t6639B!", "VersusTrade-Live1")
]

for label, path, login, pwd, srv in terminals:
    print(f"\n==========================================")
    print(f" {label}")
    print(f"==========================================")
    init_res = mt5.initialize(path=path, login=login, password=pwd, server=srv)
    if not init_res:
        print(f"Failed to initialize: {mt5.last_error()}")
        continue
    
    acc = mt5.account_info()
    if acc:
        print(f"Login       : {acc.login}")
        print(f"Server      : {acc.server}")
        print(f"Currency    : {acc.currency}")
        print(f"Balance     : {acc.balance:,.2f}")
        print(f"Equity      : {acc.equity:,.2f}")
        print(f"Floating    : {acc.profit:+,.2f}")
        print(f"Margin      : {acc.margin:,.2f}")
        print(f"Free Margin : {acc.margin_free:,.2f}")
        print(f"Trade Allowed (Account): {acc.trade_allowed}")
        print(f"Algo / EA Allowed      : {acc.trade_expert}")
    else:
        print("Could not retrieve account info.")
    
    positions = mt5.positions_get()
    if positions:
        print(f"\nOpen Positions ({len(positions)}):")
        for p in positions:
            pos_type = "BUY" if p.type == 0 else "SELL"
            print(f"  - Ticket #{p.ticket} | {p.symbol} {pos_type} {p.volume:.2f} lots @ {p.price_open:.5f} | SL: {p.sl} | TP: {p.tp} | Profit: {p.profit:+.2f}")
    else:
        print("\nOpen Positions: 0 (No active positions)")
        
    mt5.shutdown()
