@echo off
title AMATERASU X - QUICK FIX & AUTO RUNNER
color 0A
echo ===================================================================
echo   AMATERASU X - KEMASKINI & JALANKAN BRIDGE AKAUN 2 (#5100207348)
echo ===================================================================
echo.

if not exist "C:\AmaterasuX_Acc2" mkdir "C:\AmaterasuX_Acc2"

echo [1/4] Memuat turun bridge terkini dari Render...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py"

echo [2/4] Menulis konfigurasi Akaun #2 (#5100207348)...
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':3,'max_slippage_pips':5,'magic_number':888998,'mt5_login':5100207348,'mt5_password':'mfd2e!3V','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20}}; t2=r'C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe'; cfg['mt5_terminal_path']=t2 if os.path.exists(t2) else ''; open(r'C:\AmaterasuX_Acc2\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe" (
  echo Membuka Terminal MT5 Kedua...
  start "" "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe" /portable
  timeout /t 3 >nul
)

echo [3/4] Konfigurasi Akaun 2 siap!
echo.
echo [4/4] Memulakan Bridge Akaun 2 (#5100207348)...
cd /d C:\AmaterasuX_Acc2
python amaterasu_mt5_bridge.py

pause
