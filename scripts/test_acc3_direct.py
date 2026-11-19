import MetaTrader5 as mt5
import sys

print("Initializing MT5...", flush=True)
path = r"C:\VersusTrade_Acc3\terminal64.exe"
init_res = mt5.initialize(path=path, portable=True, timeout=10000)
print(f"Init result: {init_res}", flush=True)

if init_res:
    acc = mt5.account_info()
    if acc:
        print(f"Login: {acc.login}, Name: {acc.name}, Server: {acc.server}", flush=True)
        print(f"Balance: {acc.balance}, Equity: {acc.equity}, Profit: {acc.profit}", flush=True)
        positions = mt5.positions_get()
        print(f"Open positions count: {len(positions) if positions else 0}", flush=True)
        if positions:
            for p in positions:
                print(f" - Ticket {p.ticket}: {p.symbol} {p.type} vol={p.volume} open={p.price_open} sl={p.sl} tp={p.tp} profit={p.profit}", flush=True)
    else:
        print(f"Failed to get account info: {mt5.last_error()}", flush=True)
    mt5.shutdown()
else:
    print(f"Init failed: {mt5.last_error()}", flush=True)
