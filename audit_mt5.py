import MetaTrader5 as mt5
from datetime import datetime, timedelta
import sys

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except:
    pass

terminals = [
    ("Master 1", r"C:\VersusTrade_Acc1\terminal64.exe", r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"),
    ("Master 2", r"C:\VersusTrade_Acc2\terminal64.exe", None),
    ("Master 3", r"C:\VersusTrade_Acc3\terminal64.exe", None)
]

print("===============================================================================")
print("                   AMATERASU X - AUDIT MT5 RASMI DARI VPS")
print("===============================================================================\n")

for label, p1, p2 in terminals:
    path = p1
    import os
    if not os.path.exists(path) and p2 and os.path.exists(p2):
        path = p2
        
    print(f"--- {label} ({path}) ---")
    if not os.path.exists(path):
        print(f"Path tidak wujud: {path}\n")
        continue
        
    if not mt5.initialize(path=path):
        print(f"Gagal initialize MT5: {mt5.last_error()}\n")
        continue
        
    acc = mt5.account_info()
    if not acc:
        print(f"Gagal baca account info: {mt5.last_error()}\n")
        mt5.shutdown()
        continue
        
    print(f"Login      : {acc.login}")
    print(f"Nama       : {acc.name}")
    print(f"Server     : {acc.server}")
    print(f"Currency   : {acc.currency}")
    print(f"Baki Semasa (Balance) : {acc.balance:,.2f}")
    print(f"Ekuiti Semasa (Equity): {acc.equity:,.2f}")
    print(f"Floating Profit       : {acc.profit:,.2f}")
    
    # Kiraan Sejarah Deals
    from_t = datetime(2020, 1, 1)
    to_t = datetime.now() + timedelta(days=1)
    deals = mt5.history_deals_get(from_t, to_t)
    
    deposits = 0.0
    withdrawals = 0.0
    closed_trade_profit = 0.0
    swap = 0.0
    commission = 0.0
    
    if deals:
        for d in deals:
            if d.entry == 2 or "deposit" in d.comment.lower() or "withdraw" in d.comment.lower():
                if d.profit > 0:
                    deposits += d.profit
                else:
                    withdrawals += abs(d.profit)
            elif d.entry == 1:
                closed_trade_profit += d.profit
                swap += d.swap
                commission += d.commission
                
    net_realised = closed_trade_profit + swap + commission
    growth = ((net_realised / deposits) * 100) if deposits > 0 else 0.0
    
    print(f"Jumlah Deposit Masuk  : {deposits:,.2f}")
    print(f"Jumlah Pengeluaran(WD): {withdrawals:,.2f}")
    print(f"Keuntungan Bersih(Net): {net_realised:,.2f}")
    print(f"Peratusan Untung Sebenar: {growth:,.2f} %\n")
    
    mt5.shutdown()

print("===============================================================================")
