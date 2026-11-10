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
    ("Default Program Files", r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"),
    ("Acc1 (VersusTrade_Acc1)", r"C:\VersusTrade_Acc1\terminal64.exe"),
    ("Acc2 (VersusTrade_Acc2)", r"C:\VersusTrade_Acc2\terminal64.exe"),
    ("Acc3 (VersusTrade_Acc3)", r"C:\VersusTrade_Acc3\terminal64.exe")
]

print("===============================================================================")
print("                   AMATERASU X - DEEP AUDIT MT5 TERMINALS")
print("===============================================================================\n")

all_reports = []
seen_logins = set()

for label, path in terminals:
    print(f"--- [{label}] ({path}) ---")
    if not os.path.exists(path):
        print(f"Path tidak dijumpai: {path}\n")
        continue
        
    # Launch in portable mode if in custom drive folder, else standard
    is_portable = "VersusTrade_Acc" in path
    init_res = mt5.initialize(path=path, portable=is_portable) if is_portable else mt5.initialize(path=path)
    if not init_res:
        # Fallback standard init
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
    print(f"Baki Semasa (Balance) : {acc.balance:,.2f} {acc.currency}")
    print(f"Ekuiti Semasa (Equity): {acc.equity:,.2f} {acc.currency}")
    print(f"Floating Profit       : {acc.profit:,.2f} {acc.currency}")
    
    # Kiraan Sejarah Deals
    from_t = datetime(2020, 1, 1)
    to_t = datetime.now() + timedelta(days=2)
    deals = mt5.history_deals_get(from_t, to_t)
    
    deposits = 0.0
    withdrawals = 0.0
    closed_trade_profit = 0.0
    swap = 0.0
    commission = 0.0
    
    if deals:
        for d in deals:
            # In MT5: DEAL_TYPE_BALANCE = 2, DEAL_TYPE_CREDIT = 3
            # DEAL_TYPE_BUY = 0, DEAL_TYPE_SELL = 1
            deal_type = getattr(d, 'type', None)
            comment = str(getattr(d, 'comment', '')).lower()
            
            is_balance_op = (deal_type == 2) or ('deposit' in comment) or ('withdraw' in comment)
            
            if is_balance_op:
                if d.profit > 0:
                    deposits += d.profit
                else:
                    withdrawals += abs(d.profit)
            elif deal_type in [0, 1] or getattr(d, 'entry', 0) in [1, 2]:
                closed_trade_profit += d.profit
                swap += getattr(d, 'swap', 0.0)
                commission += getattr(d, 'commission', 0.0)
                
    net_realised = closed_trade_profit + swap + commission
    
    # Fallback jika deposit tidak direkod dalam history deal broker (cth: transfer dalaman)
    effective_deposit = deposits
    if effective_deposit <= 0:
        # Anggaran deposit = Balance - Net Realised + Withdrawals
        effective_deposit = max(round(acc.balance - net_realised + withdrawals, 2), 0.0)
        if effective_deposit <= 0:
            effective_deposit = 1000.0 if acc.currency == "USD" else 10000.0
            
    growth = ((net_realised / effective_deposit) * 100) if effective_deposit > 0 else 0.0
    
    print(f"Jumlah Deposit (In)   : {deposits:,.2f} {acc.currency} (Deposit Efektif: {effective_deposit:,.2f})")
    print(f"Jumlah Pengeluaran(WD): {withdrawals:,.2f} {acc.currency}")
    print(f"Untung Dagangan (Net) : {net_realised:,.2f} {acc.currency}")
    print(f"Peratusan Pertumbuhan : {growth:,.2f} %\n")
    
    report_item = {
        "label": label,
        "login": int(acc.login),
        "name": str(acc.name),
        "server": str(acc.server),
        "currency": str(acc.currency),
        "balance": round(float(acc.balance), 2),
        "equity": round(float(acc.equity), 2),
        "profit": round(float(acc.profit), 2),
        "deposits": round(float(effective_deposit), 2),
        "withdrawals": round(float(withdrawals), 2),
        "netRealised": round(float(net_realised), 2),
        "growthPct": round(float(growth), 2)
    }
    all_reports.append(report_item)
    
    mt5.shutdown()

print("===============================================================================")
print("Menghantar audit terus ke Pelayan Amaterasu X...")

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
