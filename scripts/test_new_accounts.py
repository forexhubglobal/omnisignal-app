import MetaTrader5 as mt5

accounts = [
    ("Master 1 (Cent+)", 5100221532, "6ddex3!S", "VersusTrade-Live1", r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"),
    ("Master 2 (Cent+)", 5100221533, "o6019f!F", "VersusTrade-Live1", r"C:\VersusTrade_Acc2\terminal64.exe"),
    ("Master 3 (Standard+)", 5100221534, "Ncafe2!s", "VersusTrade-Live1", r"C:\VersusTrade_Acc3\terminal64.exe")
]

print("=== TESTING LOGIN FOR 3 NEW ACCOUNTS ===")
for name, login, pwd, srv, path in accounts:
    print(f"\nConnecting {name} -> Login: {login} on {srv}...")
    ok = mt5.initialize(path=path, login=login, password=pwd, server=srv)
    if not ok:
        # Fallback without path if path issues
        ok = mt5.initialize(login=login, password=pwd, server=srv)
    if ok:
        acc = mt5.account_info()
        if acc:
            print(f"  [SUCCESS] {name} Connected!")
            print(f"  Name: {acc.name} | Currency: {acc.currency} | Balance: {acc.balance} | Equity: {acc.equity}")
        else:
            print(f"  [FAILED] Account info returned None: {mt5.last_error()}")
        mt5.shutdown()
    else:
        print(f"  [FAILED] mt5.initialize failed: {mt5.last_error()}")
