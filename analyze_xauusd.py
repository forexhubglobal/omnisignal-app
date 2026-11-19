import MetaTrader5 as mt5
import datetime
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

init = mt5.initialize(path=r'C:\VersusTrade_Acc3\terminal64.exe', login=5100221534, password='Tengku1990@', server='VersusTrade-Live1')
if not init:
    print('Failed to init MT5:', mt5.last_error())
    exit()

symbols = [s.name for s in mt5.symbols_get() if 'XAU' in s.name.upper() or 'GOLD' in s.name.upper()]
sym = 'XAUUSD.s' if 'XAUUSD.s' in symbols else ('XAUUSD' if 'XAUUSD' in symbols else symbols[0])
mt5.symbol_select(sym, True)
tick = mt5.symbol_info_tick(sym)
print(f'Symbol: {sym} | Last Bid: {tick.bid} | Last Ask: {tick.ask}')

tfs = {
    'W1 (Weekly)': (mt5.TIMEFRAME_W1, 8),
    'D1 (Daily)': (mt5.TIMEFRAME_D1, 15),
    'H4 (4-Hour)': (mt5.TIMEFRAME_H4, 20),
    'H1 (1-Hour)': (mt5.TIMEFRAME_H1, 24),
    'M15 (15-Min)': (mt5.TIMEFRAME_M15, 24)
}

for tf_name, (tf_val, count) in tfs.items():
    rates = mt5.copy_rates_from_pos(sym, tf_val, 0, count)
    if rates is not None and len(rates) > 0:
        closes = [r['close'] for r in rates]
        highs = [r['high'] for r in rates]
        lows = [r['low'] for r in rates]
        
        last = rates[-1]
        prev = rates[-2] if len(rates) > 1 else last
        
        # EMA 20
        multiplier = 2 / (20 + 1)
        ema = closes[0]
        for c in closes[1:]:
            ema = (c - ema) * multiplier + ema
        
        last_dt = datetime.datetime.fromtimestamp(last['time'])
        prev_dt = datetime.datetime.fromtimestamp(prev['time'])
        
        is_bearish = last['close'] < last['open']
        is_below_ema20 = last['close'] < ema
        high_swing = max(highs)
        low_swing = min(lows)
        
        print(f'\n======================================================')
        print(f' TIMEFRAME: {tf_name}')
        print(f'======================================================')
        print(f'Last Candle: {last_dt} | O={last["open"]:.2f} H={last["high"]:.2f} L={last["low"]:.2f} C={last["close"]:.2f} | {"BEARISH (MERAH)" if is_bearish else "BULLISH (HIJAU)"}')
        print(f'Prev Candle: {prev_dt} | O={prev["open"]:.2f} H={prev["high"]:.2f} L={prev["low"]:.2f} C={prev["close"]:.2f}')
        print(f'Recent Range ({count} bars): Swing High={high_swing:.2f} | Swing Low={low_swing:.2f}')
        print(f'EMA20: {ema:.2f} | Status: {"DI BAWAH EMA20 (Tekanan Jualan / Bearish)" if is_below_ema20 else "DI ATAS EMA20 (Sokongan Belian / Bullish)"}')
        
        print('Baris 5 Lilin Terkini:')
        for r in rates[-5:]:
            dt = datetime.datetime.fromtimestamp(r['time'])
            c_type = "[BEAR MERAH]" if r['close'] < r['open'] else "[BULL HIJAU]"
            diff = r['close'] - r['open']
            print(f'  * {dt} | O={r["open"]:.2f} H={r["high"]:.2f} L={r["low"]:.2f} C={r["close"]:.2f} ({diff:+.2f}) | {c_type}')

mt5.shutdown()
