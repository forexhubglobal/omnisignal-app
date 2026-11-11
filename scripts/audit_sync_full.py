import requests, json, time, os

base_url = 'https://amaterasux.com'
print('=== 1. AUDIT CLOUDFLARE CUSTOM DOMAIN & ENDPOINTS ===')
endpoints = ['/api/copytrade/info', '/api/data', '/api/ai/status', '/fix.ps1', '/amaterasu_mt5_bridge.py']
for ep in endpoints:
    try:
        t0 = time.time()
        r = requests.get(base_url + ep, timeout=5)
        dt = (time.time() - t0) * 1000
        print(f"  [OK] {ep:<28} -> HTTP {r.status_code} ({len(r.content):>6} bytes, {dt:.0f}ms)")
    except Exception as e:
        print(f"  [FAIL] {ep:<28} -> {e}")

print('\n=== 2. AUDIT 3 MASTER MT5 ACCOUNTS TELEMETRY ===')
r = requests.get(base_url + '/api/copytrade/info', timeout=5).json()
masters = r.get('copytrades', [])
print(f"Total Masters Connected: {len(masters)}")
for m in masters:
    open_pos = m.get('openPositions', [])
    print(f"  Account #{m.get('masterAccount')} ({m.get('name')}): Balance {m.get('currentBalance')} | Equity {m.get('currentEquity')} | Open Pos: {len(open_pos)} | LastSync: {m.get('lastSync')}")
    for p in open_pos:
        print(f"     Ticket #{p.get('ticket')} {p.get('symbol')} {p.get('type')} @ {p.get('openPrice')} | SL: {p.get('sl')} | TP: {p.get('tp')} | Profit: {p.get('profit')}")

print('\n=== 3. AUDIT AI ENGINE & ACTIVE SIGNALS ===')
ai = requests.get(base_url + '/api/ai/status', timeout=5).json()
print(f"  Mode: {ai.get('frequencyMode')} | Target Winrate: {ai.get('targetWinrate')}% | Interval: {ai.get('scanIntervalSec')}s | Enabled: {ai.get('enabled')}")
print(f"  Session Active: {ai.get('sessionActive')} | Current MYT: {ai.get('currentMYT')}")
print('  Recent Logs (Top 5):')
for l in ai.get('logHistory', [])[:5]:
    print('   ', l)

data = requests.get(base_url + '/api/data', timeout=5).json()
active_sigs = data.get('activeSignals', [])
print(f"\n  Active Signals on Web App: {len(active_sigs)}")
for s in active_sigs:
    print(f"   #{s.get('symbol')} {s.get('type')} @ {s.get('entry')} | SL: {s.get('sl')} | TP1: {s.get('tp1')} | Ticks: {s.get('ticks')} | Verified: {s.get('mt5Verified')}")

print('\n=== 4. AUDIT LOCAL FOLDERS & CONFIG CONSISTENCY ===')
cfg_paths = [
    'C:/AmaterasuX/bridge_config.json',
    'C:/AmaterasuX_Acc2/bridge_config.json',
    'C:/AmaterasuX_Acc3/bridge_config.json'
]
for cp in cfg_paths:
    if os.path.exists(cp):
        with open(cp, 'r', encoding='utf-8') as f:
            c = json.load(f)
        print(f"  [OK] {cp} -> server: {c.get('server_url')}, pairs: {c.get('allowed_pairs')}")
    else:
        print(f"  [WARN] {cp} not found locally")
