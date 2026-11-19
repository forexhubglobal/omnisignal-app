import json

with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print("=== DB COPYTRADE MASTER 1 ===")
ct1 = db.get('copytrade', {})
print("Bal:", ct1.get('currentBalance'), "Eq:", ct1.get('currentEquity'), "LastSync:", ct1.get('lastSync'), "OpenPos count:", len(ct1.get('openPositions', [])))

print("=== DB COPYTRADE MASTER 2 ===")
ct2 = db.get('copytrade2', {})
print("Bal:", ct2.get('currentBalance'), "Eq:", ct2.get('currentEquity'), "LastSync:", ct2.get('lastSync'), "OpenPos count:", len(ct2.get('openPositions', [])))

print("=== DB COPYTRADE MASTER 3 ===")
ct3 = db.get('copytrade3', {})
print("Bal:", ct3.get('currentBalance'), "Eq:", ct3.get('currentEquity'), "LastSync:", ct3.get('lastSync'), "OpenPos count:", len(ct3.get('openPositions', [])))

print("\n=== CLOSED SIGNALS IN DB ===")
signals = db.get('signals', [])
for s in signals:
    if s.get('symbol') == 'XAUUSD':
        print(f"[{s.get('id')}] {s.get('type')} @ {s.get('entry')} -> Status: {s.get('status')}, Pips: {s.get('floatingPips')}, Reason: {s.get('closeReason') or s.get('status')}")
