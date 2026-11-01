import MetaTrader5 as mt5
from datetime import datetime, timezone, timedelta
import collections

if not mt5.initialize():
    print("Failed to initialize MT5")
    exit()

symbol = "USDCAD.c"
if not mt5.symbol_select(symbol, True):
    for s in mt5.symbols_get():
        if "CAD" in s.name.upper() and "USD" in s.name.upper():
            symbol = s.name
            break

print(f"Analyzing volatility for {symbol}...")

# Copy last 2000 H1 candles (~3 months of hourly data)
rates_h1 = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_H1, 0, 2000)
# Copy last 4000 M15 candles (~1.5 months of M15 data)
rates_m15 = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M15, 0, 4000)

hourly_ranges = collections.defaultdict(list)
hourly_volumes = collections.defaultdict(list)

if rates_h1 is not None and len(rates_h1) > 0:
    pip_multiplier = 10000.0 # 1 pip = 0.0001
    for r in rates_h1:
        # Convert UTC timestamp to MYT (UTC+8)
        dt_myt = datetime.fromtimestamp(r['time'], timezone.utc).astimezone(timezone(timedelta(hours=8)))
        hour = dt_myt.hour
        pips = (r['high'] - r['low']) * pip_multiplier
        vol = r['tick_volume']
        hourly_ranges[hour].append(pips)
        hourly_volumes[hour].append(vol)

    print("\n=== USDCAD HOURLY VOLATILITY & VOLUME AUTOPSY (MYT TIME) ===")
    print("Hour (MYT) | Avg Pip Range | Max Pip Range | Avg Tick Volume | Session Phase")
    print("-" * 75)
    
    sorted_hours = sorted(hourly_ranges.keys())
    for h in sorted_hours:
        rngs = hourly_ranges[h]
        vols = hourly_volumes[h]
        avg_rng = sum(rngs) / len(rngs) if rngs else 0
        max_rng = max(rngs) if rngs else 0
        avg_vol = sum(vols) / len(vols) if vols else 0
        
        # Label session
        if 6 <= h < 14:
            phase = "Asian Session (Perlahan / Slow)"
        elif 14 <= h < 19:
            phase = "London Open (Sederhana / Moderate)"
        elif 19 <= h <= 23:
            phase = "[PEAK] US & Canada Overlap (SANGAT LAJU / EXPLOSIVE)"
        elif 0 <= h < 3:
            phase = "Late NY / Winding Down"
        else:
            phase = "Rollover / Quiet"
            
        print(f"{h:02d}:00 MYT  | {avg_rng:6.1f} pips    | {max_rng:6.1f} pips    | {avg_vol:8.0f} vol     | {phase}")

# Check deals for USDCAD in MT5 history
deals = mt5.history_deals_get(datetime.now(timezone.utc) - timedelta(days=30), datetime.now(timezone.utc))
if deals:
    cad_deals = [d for d in deals if "CAD" in d.symbol.upper() and d.entry == 1]
    print(f"\nTotal closed USDCAD deals in past 30 days: {len(cad_deals)}")
    cad_wins = [d for d in cad_deals if d.profit >= 0]
    cad_profit = sum(d.profit for d in cad_deals)
    print(f"USDCAD Winrate: {len(cad_wins)/len(cad_deals)*100:.1f}% ({len(cad_wins)}/{len(cad_deals)}) | Net Profit: {cad_profit:+.2f} USC")

mt5.shutdown()
