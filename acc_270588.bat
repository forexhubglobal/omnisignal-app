@echo off
title AMATERASU X - SETUP & RUNNER (#270588)
color 0A
echo =====================================================================
echo       AMATERASU X - SETUP TERMINAL & BRIDGE AKAUN #270588
echo =====================================================================
echo.

set "B_DIR=C:\AmaterasuX_270588"
if not exist "%B_DIR%" mkdir "%B_DIR%"

:: Pilihan Server Broker (Default: VersusTrade-Live1)
set "MT5_SERVER=VersusTrade-Live1"
if not "%~1"=="" set "MT5_SERVER=%~1"

echo [1/3] Memuat turun bridge terkini...
curl -s -L "https://amaterasux.com/amaterasu_mt5_bridge.py" -o "%B_DIR%\amaterasu_mt5_bridge.py"

echo [2/3] Mengesahkan konfigurasi Akaun #270588...
python -c "import json; cfg={'server_url':'https://amaterasux.com','lot_size':0.01,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':4,'max_slippage_pips':10,'magic_number':270588,'mt5_login':270588,'mt5_password':'RqN_A2Hk','mt5_server':'%MT5_SERVER%','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.01,'USDCHF':0.01,'EURUSD':0.01}}; open(r'%B_DIR%\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

echo [3/3] Memulakan Amaterasu MT5 Bridge Akaun #270588...
cd /d "%B_DIR%"
python amaterasu_mt5_bridge.py
pause
