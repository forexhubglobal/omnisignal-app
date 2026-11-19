import MetaTrader5 as mt5
import json, requests

print("=== 1. AUDIT TERMINAL MT5 (3 MASTER ACCOUNTS) ===")
accounts = [
    ("Master 1 (Cent)", 5100154135, "C:\\Program Files\\Versus Trade MetaTrader 5 Terminal\\terminal64.exe"),
    ("Master 2 (Cent)", 5100207348, "C:\\VersusTrade_Acc2\\terminal64.exe"),
    ("Master 3 (Standard $1k)", 5100209626, "C:\\VersusTrade_Acc3\\terminal64.exe")
]

for name, login, path in accounts:
    if mt5.initialize(path=path):
        acc = mt5.account_info()
        term = mt5.terminal_info()
        positions = mt5.positions_get() or []
        curr = acc.currency if acc else ""
        bal = acc.balance if acc else 0
        eq = acc.equity if acc else 0
        trade_ok = term.trade_allowed if term else False
        print(f"{name} #{login}: Connected={acc is not None} | TradeAllowed={trade_ok} | Balance={bal} {curr} | Equity={eq} | OpenPos={len(positions)}")
        mt5.shutdown()
    else:
        print(f"{name} #{login}: FAILED TO INITIALIZE")

print("\n=== 2. AUDIT SERVER LOCAL & CLOUDFLARE TUNNEL ===")
try:
    r = requests.get("http://127.0.0.1:3000/api/copytrade/info", timeout=3)
    data = r.json()
    print(f"Local Server (3000): SUCCESS | Master 1 Bal: {data.get('copytrade', {}).get('currentBalance')} | Master 2 WD: {data.get('copytrade2', {}).get('totalWithdrawn')} USC | Master 3 Equity: ${data.get('copytrade3', {}).get('currentEquity')} USD")
except Exception as e:
    print("Local Server Error:", e)

try:
    r2 = requests.get("https://equal-shield-amber-wilderness.trycloudflare.com/api/copytrade/info", timeout=5)
    data2 = r2.json()
    print(f"Cloudflare Tunnel: SUCCESS | Master 2 WD: {data2.get('copytrade2', {}).get('totalWithdrawn')} USC | Master 3 Equity: ${data2.get('copytrade3', {}).get('currentEquity')} USD")
except Exception as e:
    print("Cloudflare Tunnel Error:", e)

print("\n=== 3. AUDIT BRIDGE CONFIGS (NEWS LOT SIZES) ===")
for path in ["C:/AmaterasuX/bridge_config.json", "C:/AmaterasuX_Acc2/bridge_config.json", "C:/AmaterasuX_Acc3/bridge_config.json"]:
    with open(path) as f:
        cfg = json.load(f)
    folder = path.split("/")[1]
    print(f"{folder} -> Login: {cfg.get('mt5_login')} | News Gold: {cfg.get('news_gold_lot_size')} | News FX: {cfg.get('news_fx_lot_size')} | Max Lots: {cfg.get('max_account_lots')}")

print("\n=== 4. AUDIT ACTIVE SIGNALS & SYSTEM INTEGRITY ===")
try:
    r3 = requests.get("http://127.0.0.1:3000/api/data", timeout=3)
    d3 = r3.json()
    active_sigs = d3.get("activeSignals", [])
    print(f"Active Signals Count: {len(active_sigs)}")
    for s in active_sigs:
        print(f" • #{s.get('id')} {s.get('symbol')} {s.get('type')} @ {s.get('entry')} | TP1={s.get('tp1')} SL={s.get('sl')} | Notes: {s.get('notes')[:40]}...")
    
    news_stats = d3.get("aiNewsStats", {})
    print(f"AI News Stats: Total={news_stats.get('totalNewsSignals')} | WinRate={news_stats.get('winRate')}% | TP Hit={news_stats.get('tpHit')} | SL Hit={news_stats.get('slHit')} | Pips=+{news_stats.get('totalPips')}p")
except Exception as e:
    print("API Data Error:", e)
