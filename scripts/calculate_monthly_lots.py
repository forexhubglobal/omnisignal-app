import MetaTrader5 as mt5
from datetime import datetime, timedelta
import json
import sys

def analyze_lots():
    if not mt5.initialize():
        print("Failed to initialize MT5")
        return

    acc = mt5.account_info()
    if not acc:
        print("Failed to get account info")
        mt5.shutdown()
        return

    # Fetch history
    from_date = datetime(2025, 1, 1)
    to_date = datetime.now() + timedelta(days=2)
    deals = mt5.history_deals_get(from_date, to_date)

    if deals is None or len(deals) == 0:
        print("No deals found")
        mt5.shutdown()
        return

    # Check contract size for traded symbols
    sample_symbols = set(d.symbol for d in deals if d.symbol)
    symbol_contract_sizes = {}
    for sym in sample_symbols:
        s_info = mt5.symbol_info(sym)
        if s_info:
            symbol_contract_sizes[sym] = {
                'trade_contract_size': s_info.trade_contract_size,
                'volume_min': s_info.volume_min,
                'volume_step': s_info.volume_step
            }

    # Extract trade deals (ENTRY_IN or ENTRY_OUT to avoid double counting)
    closed_deals = [d for d in deals if d.symbol and d.entry in [1, 2, 3]]
    all_in_deals = [d for d in deals if d.symbol and d.entry == 0]

    deal_times = [datetime.fromtimestamp(d.time) for d in closed_deals]
    start_date = min(deal_times)
    end_date = max(deal_times)
    total_days = max((end_date - start_date).days + 1, 1)
    total_weeks = total_days / 7.0
    total_months = total_days / 30.0

    by_symbol = {}
    total_closed_lots = 0.0
    total_profit_usc = 0.0
    total_trades = 0
    wins = 0
    losses = 0

    by_day = {}
    by_week = {}

    for d in closed_deals:
        sym = d.symbol
        vol = d.volume
        prof = d.profit
        total_closed_lots += vol
        total_profit_usc += prof
        total_trades += 1
        if prof > 0: wins += 1
        elif prof < 0: losses += 1

        if sym not in by_symbol:
            by_symbol[sym] = {'count': 0, 'lots': 0.0, 'profit': 0.0, 'wins': 0, 'losses': 0}
        by_symbol[sym]['count'] += 1
        by_symbol[sym]['lots'] += vol
        by_symbol[sym]['profit'] += prof
        if prof > 0: by_symbol[sym]['wins'] += 1
        elif prof < 0: by_symbol[sym]['losses'] += 1

        day_str = datetime.fromtimestamp(d.time).strftime('%Y-%m-%d')
        by_day[day_str] = by_day.get(day_str, 0.0) + vol

        week_str = datetime.fromtimestamp(d.time).strftime('20%y-Minggu %W')
        by_week[week_str] = by_week.get(week_str, 0.0) + vol

    open_positions = mt5.positions_get()
    open_lots = sum(p.volume for p in open_positions) if open_positions else 0.0

    unique_active_days = len(by_day)
    avg_lots_per_calendar_day = total_closed_lots / total_days
    avg_lots_per_active_day = total_closed_lots / unique_active_days if unique_active_days > 0 else 0.0
    avg_lots_per_week = total_closed_lots / max(total_weeks, 1)

    # Standard forex month = ~22 trading days (active market days)
    projected_monthly_lots_active_days = avg_lots_per_active_day * 22
    # Calendar month = 30.4 days
    projected_monthly_lots_calendar = avg_lots_per_calendar_day * 30.4

    # Standard lot equivalence (Cent lot / 100)
    std_closed_lots = total_closed_lots / 100.0
    std_monthly_active = projected_monthly_lots_active_days / 100.0

    report = []
    report.append("=================================================================")
    report.append("       LAPORAN SEBENAR & UNJURAN LOT SEBULAN (THE MIGHTY DUCK)    ")
    report.append("=================================================================")
    report.append(f"Akaun MT5          : #{acc.login} ({acc.name})")
    report.append(f"Broker / Server    : {acc.server} ({acc.company})")
    report.append(f"Mata Wang Akaun    : {acc.currency} (Cent Account)")
    report.append(f"Baki Semasa        : {acc.balance:,.2f} USC")
    report.append(f"Ekuiti Semasa      : {acc.equity:,.2f} USC (${acc.equity/100:,.2f} USD)")
    report.append("-----------------------------------------------------------------")
    report.append("TEMPOH OPERASI:")
    report.append(f"Tarikh Mula Trade  : {start_date.strftime('%d %b %Y, %H:%M MYT')}")
    report.append(f"Tarikh Terakhir    : {end_date.strftime('%d %b %Y, %H:%M MYT')}")
    report.append(f"Jumlah Hari Kalendar : {total_days} hari (~{total_weeks:.1f} minggu)")
    report.append(f"Hari Aktif Berdagang : {unique_active_days} hari pasaran")
    report.append("-----------------------------------------------------------------")
    report.append("JUMLAH REKOD LOT TERKUMPUL (TERBUKTI DI MT5):")
    report.append(f"Jumlah Posisi Ditutup  : {total_trades:,} trade")
    report.append(f"Jumlah Lot Cent Ditutup: {total_closed_lots:,.2f} Cent Lot")
    report.append(f"Nilai Standard Lot     : {std_closed_lots:,.2f} Standard Lot")
    report.append(f"Lot Floating (Sedang Jalan): {open_lots:,.2f} Cent Lot ({len(open_positions) if open_positions else 0} posisi)")
    report.append(f"JUMLAH KESELURUHAN LOT : {(total_closed_lots + open_lots):,.2f} Cent Lot ({(total_closed_lots + open_lots)/100:,.2f} Std Lot)")
    report.append("-----------------------------------------------------------------")
    report.append("PURATA PRODUKSI LOT:")
    report.append(f"Purata Sehari (Hari Pasaran Aktif): {avg_lots_per_active_day:,.2f} Cent Lot / hari ({avg_lots_per_active_day/100:,.2f} Std Lot)")
    report.append(f"Purata Seminggu                   : {avg_lots_per_week:,.2f} Cent Lot / minggu ({avg_lots_per_week/100:,.2f} Std Lot)")
    report.append("-----------------------------------------------------------------")
    report.append("KIRAAN LOT YANG DIHASILKAN SEBULAN (PROJECTED MONTHLY LOTS):")
    report.append(f"[1] Berasaskan 22 Hari Bekerja Pasaran (Trading Days):")
    report.append(f"    -> {projected_monthly_lots_active_days:,.2f} CENT LOT sebulan")
    report.append(f"    -> {std_monthly_active:,.2f} STANDARD LOT sebulan")
    report.append("")
    report.append(f"[2] Berasaskan Purata Kalendar (30.4 hari):")
    report.append(f"    -> {projected_monthly_lots_calendar:,.2f} CENT LOT sebulan")
    report.append(f"    -> {projected_monthly_lots_calendar/100:,.2f} STANDARD LOT sebulan")
    report.append("=================================================================")
    report.append("PECAHAN MENGIK PASANGAN MATA WANG (SYMBOL):")
    for s, data in sorted(by_symbol.items(), key=lambda x: x[1]['lots'], reverse=True):
        wr = (data['wins'] / data['count'] * 100) if data['count'] > 0 else 0
        report.append(f" - {s:<10} : {data['lots']:>8.2f} Cent Lot ({data['lots']/100:>5.2f} Std) | {data['count']:>4} trade | WinRate: {wr:>5.1f}%")

    report.append("-----------------------------------------------------------------")
    report.append("PECAHAN LOT MENGIK MINGGU:")
    for w, l in sorted(by_week.items()):
        report.append(f" - {w:<18} : {l:>8.2f} Cent Lot ({l/100:>5.2f} Std Lot)")
    report.append("=================================================================")

    full_output = "\n".join(report)
    print(full_output)

    with open('scripts/lots_analysis_report.txt', 'w', encoding='utf-8') as f:
        f.write(full_output)

    mt5.shutdown()

if __name__ == '__main__':
    analyze_lots()
