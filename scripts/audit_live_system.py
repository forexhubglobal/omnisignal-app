import urllib.request, ssl, json, time, datetime

ctx = ssl.create_default_context()
url = 'https://equal-shield-amber-wilderness.trycloudflare.com/api/data'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        data = json.loads(r.read().decode('utf-8'))
        print('=== PUBLIC API HEALTH CHECK ===')
        print('Status:', r.status)
        print('Total Signals:', data.get('stats', {}).get('totalSignals'))
        print('Active Signals:', len(data.get('activeSignals', [])))
        print('Win Rate:', data.get('stats', {}).get('winRate'), '%')
        
        print('\n=== COPYTRADE ACCOUNTS STATUS IN DB ===')
        for key in ['copytrade', 'copytrade2', 'copytrade3']:
            acc = data.get(key)
            if acc:
                login = acc.get('login')
                bal = acc.get('balance')
                eq = acc.get('equity')
                growth = acc.get('growth')
                updated = acc.get('lastSync') or acc.get('updatedAt') or acc.get('lastUpdated')
                print(f"[{key}] Login: {login} | Bal: {bal} | Eq: {eq} | Growth: {growth}% | Updated: {updated}")
            else:
                print(f"[{key}] Not found")

        print('\n=== ACTIVE SIGNALS DETAIL ===')
        for s in data.get('activeSignals', []):
            print(f"ID: {s.get('id')} | {s.get('symbol')} {s.get('type')} @ {s.get('price')} | SL: {s.get('sl')} | TP1: {s.get('tp1')}")
        if not data.get('activeSignals'):
            print("Tiada active signals floating (Semua clean).")

except Exception as e:
    print('API Error:', e)
