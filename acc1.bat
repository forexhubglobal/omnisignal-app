@echo off
title Amaterasu Bridge - Akaun 1 (#5100154135)
color 0B
echo ===================================================================
echo   AMATERASU X - MEMULAKAN BRIDGE AKAUN 1 MASTER (#5100154135)
echo ===================================================================
echo.

if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"

set "T1_EXE=C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
if not exist "%T1_EXE%" (
  set "T1_EXE=C:\Program Files\MetaTrader 5\terminal64.exe"
)

echo [1/3] Memuat turun bridge terkini dari Cloudflare...
curl -s -L "https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX\amaterasu_mt5_bridge.py"

echo [2/3] Mengesahkan konfigurasi Akaun 1...
python -c "import json, os; cfg={'server_url':'https://equal-shield-amber-wilderness.trycloudflare.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':4,'max_slippage_pips':5,'magic_number':888999,'mt5_login':5100154135,'mt5_password':'4e364w!L','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20},'mt5_terminal_path':r'%T1_EXE%'}; open(r'C:\AmaterasuX\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

echo [3/3] Memulakan Terminal 1 MT5 & Bridge Akaun 1 (#5100154135)...
start "" "%T1_EXE%" /portable
timeout /t 3 >nul

cd /d C:\AmaterasuX
python amaterasu_mt5_bridge.py

pause
