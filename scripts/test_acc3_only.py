import MetaTrader5 as mt5

login = 5100221534
pwd = "Ncafe2!s"
server = "VersusTrade-Live1"
path = r"C:\VersusTrade_Acc3\terminal64.exe"

print(f"Connecting specifically to Account 3 #{login}...")
# Launch with portable mode for Acc3
ok = mt5.initialize(path=path, login=login, password=pwd, server=server, portable=True)
if not ok:
    ok = mt5.initialize(path=path, login=login, password=pwd, server=server)
if not ok:
    ok = mt5.initialize(login=login, password=pwd, server=server)

if ok:
    acc = mt5.account_info()
    if acc:
        print(f"SUCCESS: Login={acc.login}, Balance=${acc.balance:,.2f} {acc.currency}, Equity=${acc.equity:,.2f}")
    else:
        print("Account info None:", mt5.last_error())
    mt5.shutdown()
else:
    print("Init failed:", mt5.last_error())
