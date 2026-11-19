import json

with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

print("--- VAULTS SUMMARY ---")
for k in ['copytrade', 'copytrade2', 'copytrade3']:
    v = db.get(k, {})
    print(f"{k.upper()}: Acc {v.get('masterAccount')} | Bal: {v.get('currentBalance')} | Eq: {v.get('currentEquity')} | LastSync: {v.get('lastSync')}")

print("\n--- RECENT SIGNALS IN DB (LAST 15) ---")
signals = db.get('signals', [])
for s in signals[-15:]:
    print(f"[{s.get('id')}] {s.get('symbol')} {s.get('type')} | Status: {s.get('status')} | Entry: {s.get('entry')} | Pips: {s.get('floatingPips')} | Time: {s.get('firedAt')} / {s.get('timestamp')}")

print("\n--- ACTIVE SIGNALS ---")
for s in db.get('activeSignals', []):
    print(f"[{s.get('id')}] {s.get('symbol')} {s.get('type')} | Status: {s.get('status')} | Entry: {s.get('entry')} | SL: {s.get('sl')} | TP1: {s.get('tp1')}")
