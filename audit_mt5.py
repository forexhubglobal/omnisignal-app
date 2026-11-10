import MetaTrader5 as mt5
from datetime import datetime, timedelta
import sys
import os
import json
import urllib.request

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

all_reports = []

for label, p1, p2 in terminals:
    path = p1
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
            # d.type == 2 is mt5.DEAL_TYPE_BALANCE
            is_balance = getattr(d, 'type', 0) == 2 or d.entry == 2 or "deposit" in str(d.comment).lower() or "withdraw" in str(d.comment).lower()
            if is_balance:
                if d.profit > 0:
                    deposits += d.profit
                else:
                    withdrawals += abs(d.profit)
            else:
                closed_trade_profit += d.profit
                swap += getattr(d, 'swap', 0.0)
                commission += getattr(d, 'commission', 0.0)
                
    net_realised = closed_trade_profit + swap + commission
    growth = ((net_realised / deposits) * 100) if deposits > 0 else 0.0
    
    print(f"Jumlah Deposit Masuk  : {deposits:,.2f}")
    print(f"Jumlah Pengeluaran(WD): {withdrawals:,.2f}")
    print(f"Keuntungan Bersih(Net): {net_realised:,.2f}")
    print(f"Peratusan Untung Sebenar: {growth:,.2f} %\n")
    
    report_item = {
        "label": label,
        "login": acc.login,
        "server": acc.server,
        "currency": acc.currency,
        "balance": round(float(acc.balance), 2),
        "equity": round(float(acc.equity), 2),
        "profit": round(float(acc.profit), 2),
        "deposits": round(float(deposits), 2),
        "withdrawals": round(float(withdrawals), 2),
        "netRealised": round(float(net_realised), 2),
        "growthPct": round(float(growth), 2)
    }
    all_reports.append(report_item)
    
    mt5.shutdown()

print("===============================================================================")
print("Menghantar laporan data MT5 terus ke Server Amaterasu X...")

try:
    url = "https://equal-shield-amber-wilderness.trycloudflare.com/api/market/audit-report"
    req_data = json.dumps({"reports": all_reports}).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as response:
        res_body = response.read().decode('utf-8')
        print("✅ [BERJAYA] Data MT5 telah dihantar & diselaraskan 100% dengan Amaterasu X!")
except Exception as e:
    print(f"Nota penghantaran: {e}")

print("===============================================================================\n")
