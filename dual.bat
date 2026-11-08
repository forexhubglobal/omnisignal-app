@echo off
title AMATERASU X - DUAL TERMINAL RUNNER
color 0B
echo =====================================================================
echo    AMATERASU X - AUTO SETUP ^& DUAL RUNNER (AKAUN 1 ^& AKAUN 2)
echo =====================================================================
echo.

:: 1. Identify Terminal 1 and Terminal 2
set "T1="
set "T2="
if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" set "T1=C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
if exist "C:\Program Files\MetaTrader 5\terminal64.exe" if not defined T1 set "T1=C:\Program Files\MetaTrader 5\terminal64.exe"

if exist "C:\VersusTrade_Acc2\terminal64.exe" set "T2=C:\VersusTrade_Acc2\terminal64.exe"
if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe" if not defined T2 set "T2=C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe"
if exist "C:\Program Files\MetaTrader 5 - Acc2\terminal64.exe" if not defined T2 set "T2=C:\Program Files\MetaTrader 5 - Acc2\terminal64.exe"

:: If T2 doesn't exist, clone T1
if not defined T2 (
  if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal" (
    echo Mengklon Terminal MT5 ke Folder Acc2...
    xcopy /E /I /Y "C:\Program Files\Versus Trade MetaTrader 5 Terminal" "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2" >nul
    set "T2=C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe"
  ) else if exist "C:\Program Files\MetaTrader 5" (
    echo Mengklon Terminal MT5 ke Folder Acc2...
    xcopy /E /I /Y "C:\Program Files\MetaTrader 5" "C:\Program Files\MetaTrader 5 - Acc2" >nul
    set "T2=C:\Program Files\MetaTrader 5 - Acc2\terminal64.exe"
  )
)

echo [1/4] Terminal 1: %T1%
echo [1/4] Terminal 2: %T2%

:: 2. Setup folders
if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"
if not exist "C:\AmaterasuX_Acc2" mkdir "C:\AmaterasuX_Acc2"

:: 3. Download latest bridge
echo [2/4] Memuat turun bridge terkini...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX\amaterasu_mt5_bridge.py"
copy /Y "C:\AmaterasuX\amaterasu_mt5_bridge.py" "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py" >nul

:: 4. Write config for Account 1
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':4,'max_slippage_pips':5,'magic_number':888999,'mt5_login':5100154135,'mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20}}; t1=r'%T1%'; cfg['mt5_terminal_path']=t1 if os.path.exists(t1) else ''; open(r'C:\AmaterasuX\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

:: 5. Write config for Account 2
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':3,'max_slippage_pips':5,'magic_number':888998,'mt5_login':5100207348,'mt5_password':'mfd2e!3V','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20}}; t2=r'%T2%'; cfg['mt5_terminal_path']=t2 if os.path.exists(t2) else ''; open(r'C:\AmaterasuX_Acc2\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

echo [3/4] Konfigurasi kedua-dua akaun siap!

:: 6. Launch Terminals
echo [4/4] Memulakan Terminal ^& Bridge...
if defined T1 start "" "%T1%" /portable
timeout /t 2 >nul
if defined T2 start "" "%T2%" /portable
timeout /t 3 >nul

:: 7. Launch both Bridges in new windows
start "Amaterasu Bridge - Akaun 1 (#5100154135)" cmd /k "cd /d C:\AmaterasuX && python amaterasu_mt5_bridge.py"
start "Amaterasu Bridge - Akaun 2 (#5100207348)" cmd /k "cd /d C:\AmaterasuX_Acc2 && python amaterasu_mt5_bridge.py"

echo.
echo =====================================================================
echo  [BERJAYA] Kedua-dua Akaun Kini Berjalan Serentak!
echo  Tetingkap ini boleh ditutup.
echo =====================================================================
pause
