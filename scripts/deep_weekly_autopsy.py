import MetaTrader5 as mt5
from datetime import datetime, timedelta
import collections
import os

def run_weekly_analysis():
    # Try default init first, then specific path if needed
    t1_path = r"C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
    initialized = False
    if os.path.exists(t1_path):
        initialized = mt5.initialize(t1_path, portable=True)
    if not initialized:
        initialized = mt5.initialize()
    
    if not initialized:
        print("ERROR: Could not initialize MT5. Error:", mt5.last_error())
        return

    acc = mt5.account_info()
    if not acc:
        print("ERROR: Could not get account info. Error:", mt5.last_error())
        mt5.shutdown()
        return

    print(f"Connected to Account: #{acc.login} | Currency: {acc.currency} | Balance: {acc.balance} | Equity: {acc.equity}")

    # Query all history from Oct 1, 2026 to present
    from_date = datetime(2026, 10, 1)
    to_date = datetime.now() + timedelta(days=2)
    deals = mt5.history_deals_get(from_date, to_date)

    if not deals:
        print("No deals found for the requested period.")
        mt5.shutdown()
        return

    # Filter out non-trade deals (e.g. balance deposits/withdrawals)
    # Entry 1 = OUT (closing deal), Entry 2 = IN/OUT, Entry 3 = OUT_BY
    trade_deals = [d for d in deals if d.symbol and d.entry in [1, 2, 3]]
    print(f"Total Closed Trade Deals: {len(trade_deals)}")

    # Group by ISO week (Year, Week Number)
    weeks = collections.defaultdict(list)
    for d in trade_deals:
        dt = datetime.fromtimestamp(d.time)
        iso_year, iso_week, _ = dt.isocalendar()
        weeks[(iso_year, iso_week)].append((dt, d))

    print("\n" + "="*80)
    print(f"{'MINGGU':<12} | {'TARIKH':<23} | {'PROFIT (USC)':<14} | {'TRADES':<8} | {'WINRATE':<9} | {'PF':<6} | {'STATUS'}")
    print("="*80)

    weekly_summary = []

    for (yr, wk), items in sorted(weeks.items()):
        items.sort(key=lambda x: x[0])
        start_dt = items[0][0].strftime("%d/%m")
        end_dt = items[-1][0].strftime("%d/%m/%Y")
        date_str = f"{start_dt} - {end_dt}"

        total_profit = sum(d.profit + d.commission + d.swap for _, d in items)
        wins = [d for _, d in items if (d.profit + d.commission + d.swap) > 0]
        losses = [d for _, d in items if (d.profit + d.commission + d.swap) < 0]

        win_count = len(wins)
        loss_count = len(losses)
        total_count = len(items)
        wr = (win_count / total_count * 100) if total_count > 0 else 0.0

        gross_profit = sum(d.profit + d.commission + d.swap for d in wins)
        gross_loss = abs(sum(d.profit + d.commission + d.swap for d in losses))
        pf = (gross_profit / gross_loss) if gross_loss > 0 else (99.9 if gross_profit > 0 else 0.0)

        # Breakdown by symbol
        sym_perf = collections.defaultdict(lambda: {'profit': 0.0, 'count': 0, 'wins': 0})
        for _, d in items:
            clean_sym = d.symbol.replace('.c', '').replace('.a', '').replace('.m', '').replace('.r', '').replace('.s', '')
            net = d.profit + d.commission + d.swap
            sym_perf[clean_sym]['profit'] += net
            sym_perf[clean_sym]['count'] += 1
            if net > 0:
                sym_perf[clean_sym]['wins'] += 1

        weekly_summary.append({
            'year': yr,
            'week': wk,
            'date_str': date_str,
            'profit': total_profit,
            'total_count': total_count,
            'win_count': win_count,
            'loss_count': loss_count,
            'wr': wr,
            'pf': pf,
            'sym_perf': sym_perf,
            'gross_profit': gross_profit,
            'gross_loss': gross_loss
        })

        tag = "🏆 TERBAIK (GROW)" if total_profit > 2000 else ("🟢 UNTUNG" if total_profit > 0 else "🔴 RUGI")
        print(f"Minggu {wk:<5} | {date_str:<23} | {total_profit:>+12.2f} USC | {total_count:>6} | {wr:>7.1f}% | {pf:>5.2f} | {tag}")

    print("="*80)

    # Detailed breakdown of each week
    for ws in weekly_summary:
        print(f"\n--- DETAIL MINGGU {ws['week']} ({ws['date_str']}) ---")
        print(f"Total Net Profit: {ws['profit']:+.2f} USC (${ws['profit']/100:+.2f} USD)")
        print(f"Total Trades: {ws['total_count']} (Wins: {ws['win_count']}, Losses: {ws['loss_count']}) | Win Rate: {ws['wr']:.1f}%")
        print(f"Gross Profit: {ws['gross_profit']:.2f} USC | Gross Loss: {ws['gross_loss']:.2f} USC | Profit Factor: {ws['pf']:.2f}")
        print("Prestasi Simbol:")
        for sym, sp in sorted(ws['sym_perf'].items(), key=lambda x: x[1]['profit'], reverse=True):
            sym_wr = (sp['wins'] / sp['count'] * 100) if sp['count'] > 0 else 0
            print(f"   - {sym:<8}: {sp['profit']:>+10.2f} USC | {sp['count']:>4} trades | WinRate: {sym_wr:.1f}%")

    mt5.shutdown()

if __name__ == '__main__':
    run_weekly_analysis()
