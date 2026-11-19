import json
from collections import defaultdict

with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

signals = [s for s in db.get('signals', []) if s.get('date') == 'Nov 12' or 'Nov 12' in str(s.get('firedAt', ''))]

wins = 0
losses = 0
be_count = 0
status_counts = defaultdict(int)
symbol_stats = defaultdict(lambda: {'wins': 0, 'losses': 0, 'pips': 0.0, 'tp1': 0, 'tp2': 0, 'sl': 0})
total_pips = 0.0

for s in signals:
    st = s.get('status', '')
    p = float(s.get('pips', 0) or 0)
    sym = s.get('symbol', 'UNKNOWN')
    status_counts[st] += 1
    
    tags = str(s.get('tags', []))
    is_win = p > 0 or st in ['TP1', 'TP2', 'TP3', 'TP_TRAIL', 'CLOSED IN PROFIT'] or 'TP1' in tags or 'TRAIL' in tags or st == 'BE'
    
    if is_win:
        wins += 1
        total_pips += p
        symbol_stats[sym]['wins'] += 1
        symbol_stats[sym]['pips'] += p
        if st == 'TP2':
            symbol_stats[sym]['tp2'] += 1
        else:
            symbol_stats[sym]['tp1'] += 1
        if st == 'BE':
            be_count += 1
    elif st == 'SL':
        losses += 1
        total_pips += p
        symbol_stats[sym]['losses'] += 1
        symbol_stats[sym]['sl'] += 1
        symbol_stats[sym]['pips'] += p

print('=== STATISTIK ISYARAT SEMALAM (NOV 12, 2026) ===')
print(f'Jumlah Isyarat: {len(signals)}')
print(f'Menang (Wins) : {wins}')
print(f'Kalah (Losses): {losses}')
win_rate = (wins / len(signals)) * 100 if len(signals) > 0 else 0
print(f'Kadar Kemenangan (Win Rate): {win_rate:.1f}%')
print(f'Jumlah Bersih Pips: {total_pips:+.1f} pips\n')

print('Pecahan Mengikut Status:')
for k, v in status_counts.items():
    print(f'  - {k}: {v}')

print('\nPecahan Mengikut Simbol/Aset:')
for sym, d in sorted(symbol_stats.items(), key=lambda x: x[1]['wins'], reverse=True):
    tot = d['wins'] + d['losses']
    wr = (d['wins'] / tot) * 100 if tot > 0 else 0
    print(f"  * {sym:<8}: {d['wins']:>3} Menang, {d['losses']:>2} Kalah | Win Rate: {wr:>5.1f}% | Net Pips: {d['pips']:>+7.1f}")
