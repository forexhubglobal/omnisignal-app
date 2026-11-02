import MetaTrader5 as mt5
from datetime import datetime, timedelta

def main():
    if not mt5.initialize():
        print("MT5 Init Failed")
        return

    from_date = datetime(2026, 10, 27)
    to_date = datetime.now() + timedelta(days=1)
    deals = mt5.history_deals_get(from_date, to_date)

    deals_by_symbol = {}
    for d in (deals or []):
        if not d.symbol or d.entry not in [1, 2, 3]:
            continue
        clean_sym = d.symbol.replace('.c', '').replace('.a', '').replace('.m', '').replace('.r', '').replace('.s', '')
        if clean_sym not in deals_by_symbol:
            deals_by_symbol[clean_sym] = {'profit': 0.0, 'count': 0, 'wins': 0, 'losses': 0, 'lots': 0.0}
        st = deals_by_symbol[clean_sym]
        st['profit'] += d.profit
        st['count'] += 1
        st['lots'] += d.volume
        if d.profit > 0:
            st['wins'] += 1
        elif d.profit < 0:
            st['losses'] += 1

    print("=== RECENT MT5 CLOSED TRADES (OCT 27 - NOV 2) ===")
    for sym, st in sorted(deals_by_symbol.items(), key=lambda x: x[1]['profit'], reverse=True):
        wr = (st['wins'] / st['count'] * 100) if st['count'] > 0 else 0
        print(f"[{sym}] Trades: {st['count']} | Wins: {st['wins']} | Losses: {st['losses']} | WinRate: {wr:.1f}% | Profit: {st['profit']:+.2f} USC | Lots: {st['lots']:.2f}")

    pos = mt5.positions_get()
    print("\n=== CURRENT OPEN POSITIONS ===")
    total_floating = 0.0
    for p in (pos or []):
        total_floating += p.profit
        print(f"Ticket #{p.ticket} | {p.symbol} | {'BUY' if p.type==0 else 'SELL'} | Vol: {p.volume} | Open: {p.price_open} | Cur: {p.price_current} | Profit: {p.profit:+.2f} USC")
    print(f"Total Floating PnL: {total_floating:+.2f} USC")

    acc = mt5.account_info()
    print(f"\nAccount Balance: {acc.balance:.2f} USC | Equity: {acc.equity:.2f} USC")
    mt5.shutdown()

if __name__ == '__main__':
    main()
