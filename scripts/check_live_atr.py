import MetaTrader5 as mt5, json

with open(r'C:\AmaterasuX_Acc3\bridge_config.json') as f:
    cfg = json.load(f)

mt5.initialize(path=cfg['mt5_terminal_path'], login=cfg['mt5_login'], password=cfg['mt5_password'], server=cfg['mt5_server'])

for sym in ['XAUUSD.s', 'EURUSD.s', 'USDCHF.s']:
    rates = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_M15, 0, 20)
    if rates is not None and len(rates) >= 14:
        tr_list = []
        for i in range(1, len(rates)):
            h = float(rates[i]['high'])
            l = float(rates[i]['low'])
            prev_c = float(rates[i-1]['close'])
            tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
            tr_list.append(tr)
        m15_atr = sum(tr_list[-14:]) / 14.0
        last_range = float(rates[-1]['high']) - float(rates[-1]['low'])
        cur_c = float(rates[-1]['close'])

        rates_h1 = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_H1, 0, 15)
        h1_tr = [max(float(rates_h1[i]['high']) - float(rates_h1[i]['low']), abs(float(rates_h1[i]['high']) - float(rates_h1[i-1]['close'])), abs(float(rates_h1[i]['low']) - float(rates_h1[i-1]['close']))) for i in range(1, len(rates_h1))]
        h1_atr = sum(h1_tr[-14:]) / 14.0 if len(h1_tr) >= 14 else 0.0

        clean_sym = sym.split('.')[0]
        mult = 10.0 if clean_sym == 'XAUUSD' else 10000.0
        print(f"{clean_sym}: Price={cur_c:.5f} | M15 ATR={m15_atr*mult:.1f} pips | H1 ATR={h1_atr*mult:.1f} pips | Last Candle Range={last_range*mult:.1f} pips")

mt5.shutdown()
