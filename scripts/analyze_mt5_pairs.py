import MetaTrader5 as mt5
from datetime import datetime, timedelta

def main():
    if not mt5.initialize():
        print("Failed to initialize MT5")
        return

    acc = mt5.account_info()
    print(f"Account: #{acc.login} | Currency: {acc.currency} | Balance: {acc.balance:.2f} | Equity: {acc.equity:.2f}")

    # Fetch last 30 days of deals
    from_date = datetime.now() - timedelta(days=30)
    to_date = datetime.now() + timedelta(days=1)
    deals = mt5.history_deals_get(from_date, to_date)

    if not deals:
        print("No history deals found.")
        mt5.shutdown()
        return

    deals_by_symbol = {}
    for d in deals:
        sym = d.symbol
        if not sym:
            continue
        clean_sym = sym.replace('.c', '').replace('.a', '').replace('.m', '').replace('.r', '').replace('.s', '')
        if clean_sym not in deals_by_symbol:
            deals_by_symbol[clean_sym] = {
                'profit': 0.0,
                'count': 0,
                'wins': 0,
                'losses': 0,
                'lots': 0.0,
                'commission': 0.0,
                'swap': 0.0
            }
        
        # d.entry: 0=ENTRY_IN, 1=ENTRY_OUT, 2=ENTRY_INOUT, 3=ENTRY_OUT_BY
        if d.entry in [1, 2, 3]:
            st = deals_by_symbol[clean_sym]
            st['profit'] += d.profit
            st['commission'] += d.commission
            st['swap'] += d.swap
            st['count'] += 1
            st['lots'] += d.volume
            if d.profit > 0:
                st['wins'] += 1
            elif d.profit < 0:
                st['losses'] += 1

    print("\n=== MT5 REAL CLOSED TRADES BY PAIR ===")
    total_net = 0.0
    total_trades = 0
    total_wins = 0

    for sym, st in sorted(deals_by_symbol.items(), key=lambda x: x[1]['profit'], reverse=True):
        cnt = st['count']
        if cnt == 0:
            continue
        win_rate = (st['wins'] / cnt * 100) if cnt > 0 else 0
        net = st['profit'] + st['commission'] + st['swap']
        total_net += net
        total_trades += cnt
        total_wins += st['wins']
        print(f"[{sym}]")
        print(f"  Closed Trades: {cnt} (Wins: {st['wins']}, Losses: {st['losses']}) | Win Rate: {win_rate:.1f}%")
        print(f"  Total Lots: {st['lots']:.2f}")
        print(f"  Gross Profit: {st['profit']:.2f} USC | Swap/Comm: {st['swap'] + st['commission']:.2f} USC")
        print(f"  Net Profit: {net:.2f} USC")
        print("-" * 50)

    overall_wr = (total_wins / total_trades * 100) if total_trades > 0 else 0
    print(f"\nOVERALL SUMMARY: {total_trades} trades | Win Rate: {overall_wr:.1f}% | Total Net Profit: {total_net:.2f} USC\n")

    mt5.shutdown()

if __name__ == '__main__':
    main()
