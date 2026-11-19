@echo off
title AMATERASU X - MASTER 4 SETUP & RUNNER (#5100227599)
color 0E
echo =====================================================================
echo       AMATERASU X - SETUP MASTER 4 TERMINAL & BRIDGE (#5100227599)
echo =====================================================================
echo.

set "T4_DIR=C:\VersusTrade_Acc4"
set "T4_EXE=%T4_DIR%\terminal64.exe"
set "B4_DIR=C:\AmaterasuX_Acc4"

if not exist "%T4_EXE%" (
    echo [ERROR] %T4_EXE% tidak dijumpai!
    pause
    exit /b 1
)

if not exist "%B4_DIR%" mkdir "%B4_DIR%"

echo [1/3] Menjalankan Terminal MT5 Acc4 dalam mod Portable...
start "" "%T4_EXE%" /portable

echo [2/3] Mengesahkan konfigurasi Akaun 4 (#5100227599)...
python -c "import json; cfg={'server_url':'https://amaterasux.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':4,'max_slippage_pips':10,'magic_number':888994,'mt5_login':5100227599,'mt5_password':'!b4354Q0','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20},'mt5_terminal_path':r'%T4_EXE%'}; open(r'%B4_DIR%\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

echo [3/3] Memulakan Amaterasu MT5 Bridge Akaun 4...
cd /d "%B4_DIR%"
python amaterasu_mt5_bridge.py
pause
