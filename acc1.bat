@echo off
title Amaterasu Bridge - Akaun 1 (#5100154135)
color 0B
echo ===================================================================
echo   AMATERASU X - MEMULAKAN BRIDGE AKAUN 1 MASTER (#5100154135)
echo ===================================================================
echo.

if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"

echo [1/3] Memuat turun bridge terkini dari Render...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX\amaterasu_mt5_bridge.py"

echo [2/3] Mengesahkan konfigurasi Akaun 1...
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':4,'max_slippage_pips':5,'magic_number':888999,'mt5_login':5100154135,'mt5_password':'4e364w!L','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20}}; t=[p for p in [r'C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe', r'C:\Program Files\MetaTrader 5\terminal64.exe'] if os.path.exists(p)]; cfg['mt5_terminal_path']=t[0] if t else ''; open(r'C:\AmaterasuX\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

echo [3/3] Memulakan Bridge Akaun 1 (#5100154135)...
cd /d C:\AmaterasuX
python amaterasu_mt5_bridge.py

pause
