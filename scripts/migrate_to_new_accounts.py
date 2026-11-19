import os, json

account_map = {
    "5100154135": "5100221532",
    "5100207348": "5100221533",
    "5100209626": "5100221534"
}

files_to_update = [
    "server.js",
    "js/pages-main.js",
    "AGENTS.md",
    "fix.ps1",
    "acc1.bat",
    "acc2.bat",
    "acc3.bat"
]

print("=== REPLACING ACCOUNT NUMBERS IN PROJECT FILES ===")
for fpath in files_to_update:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        changes = 0
        for old_acc, new_acc in account_map.items():
            if old_acc in content:
                count = content.count(old_acc)
                content = content.replace(old_acc, new_acc)
                changes += count
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] {fpath}: {changes} replacements made.")

print("\n=== RESETTING DATABASE VAULTS TO CLEAN NEW ACCOUNTS ===")
with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Fresh Vault 1
db['copytrade'] = {
    "id": "master-1",
    "name": "The Mighty Duck",
    "avatar": "img/themightyduck.png",
    "masterAccount": "5100221532",
    "broker": "Versus Trade Ltd. (Live1)",
    "accountType": "Cent+ USC",
    "currency": "USC",
    "initialDeposit": 10000.0,
    "totalWithdrawn": 0.0,
    "totalWithdrawnUsd": 0.0,
    "allTimeProfitUsc": 0.0,
    "allTimeProfitUsd": 0.0,
    "allTimeGrowthPct": 0.0,
    "growthPct": 0.0,
    "netProfitUsc": 0.0,
    "netProfitUsd": 0.0,
    "currentBalance": 10000.0,
    "currentEquity": 10000.0,
    "activeEquity": 10000.0,
    "activeEquityUsd": 100.0,
    "winRate": 100.0,
    "maxDrawdown": 0.0,
    "status": "LIVE & ACTIVE",
    "badge": "VAULT 1 (CENT+ VIP)",
    "copiersCount": 42,
    "affiliateLink": "https://one.versustrade.link/links/go/14490?pid=31255",
    "lastSync": "Live",
    "openPositions": []
}

# Fresh Vault 2
db['copytrade2'] = {
    "id": "master-2",
    "name": "Amaterasu X",
    "avatar": "img/amaterasux.png",
    "masterAccount": "5100221533",
    "broker": "Versus Trade Ltd. (Live1)",
    "accountType": "Cent+ USC",
    "currency": "USC",
    "initialDeposit": 10000.0,
    "totalWithdrawn": 0.0,
    "totalWithdrawnUsd": 0.0,
    "allTimeProfitUsc": 0.0,
    "allTimeProfitUsd": 0.0,
    "allTimeGrowthPct": 0.0,
    "growthPct": 0.0,
    "netProfitUsc": 0.0,
    "netProfitUsd": 0.0,
    "currentBalance": 10000.0,
    "currentEquity": 10000.0,
    "activeEquity": 10000.0,
    "activeEquityUsd": 100.0,
    "winRate": 100.0,
    "maxDrawdown": 0.0,
    "status": "LIVE & ACTIVE",
    "badge": "VAULT 2 (CENT+ VIP)",
    "copiersCount": 18,
    "affiliateLink": "https://one.versustrade.link/links/go/14490?pid=31255",
    "lastSync": "Live",
    "openPositions": []
}

# Fresh Vault 3
db['copytrade3'] = {
    "id": "master-3",
    "name": "Amaterasu X 2.0",
    "avatar": "img/amaterasux_2.jpg",
    "masterAccount": "5100221534",
    "broker": "Versus Trade Ltd. (Live1)",
    "accountType": "Standard+ USD",
    "currency": "USD",
    "initialDeposit": 1000.0,
    "totalWithdrawn": 0.0,
    "totalWithdrawnUsd": 0.0,
    "allTimeProfitUsd": 0.0,
    "allTimeGrowthPct": 0.0,
    "growthPct": 0.0,
    "netProfitUsd": 0.0,
    "currentBalance": 0.0,
    "currentEquity": 0.0,
    "activeEquity": 0.0,
    "activeEquityUsd": 0.0,
    "winRate": 100.0,
    "maxDrawdown": 0.0,
    "status": "LIVE & ACTIVE (STANDARD+ VIP)",
    "badge": "MASTER 3 (STANDARD+ USD)",
    "copiersCount": 12,
    "affiliateLink": "https://one.versustrade.link/links/go/14490?pid=31255",
    "lastSync": "Live",
    "openPositions": []
}

db['copytrades'] = [db['copytrade'], db['copytrade2'], db['copytrade3']]
db['activeSignals'] = []

with open('data/db.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2)

print("  [OK] data/db.json vaults reset to 100% clean state for new accounts!")
