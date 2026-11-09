@echo off
title AMATERASU X - MASTER 2 SETUP & RUNNER
color 0A
echo =====================================================================
echo       AMATERASU X - SETUP MASTER 2 TERMINAL & BRIDGE (#5100207348)
echo =====================================================================
echo.

:: 1. Setup Terminal 2 Folder
set "T2_DIR=C:\VersusTrade_Acc2"
set "T2_EXE=%T2_DIR%\terminal64.exe"

if not exist "%T2_EXE%" (
  if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2\terminal64.exe" (
    set "T2_DIR=C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2"
    set "T2_EXE=%T2_DIR%\terminal64.exe"
  ) else (
    echo [1/4] Mengklon Terminal MT5 ke %T2_DIR%...
    if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal" (
      xcopy /E /I /Y "C:\Program Files\Versus Trade MetaTrader 5 Terminal" "%T2_DIR%\" >nul
    ) else if exist "C:\Program Files\MetaTrader 5" (
      xcopy /E /I /Y "C:\Program Files\MetaTrader 5" "%T2_DIR%\" >nul
    )
  )
)

if exist "%T2_EXE%" (
  echo [OK] Terminal MT5 2 Bersedia di %T2_EXE%
) else (
  echo [RALAT] Gagal mengesan Terminal MT5. Sila pastikan MT5 dipasang.
)

:: 2. Setup Bridge Folder
set "B2_DIR=C:\AmaterasuX_Acc2"
if not exist "%B2_DIR%" mkdir "%B2_DIR%"

:: 3. Download Latest Bridge
echo [2/4] Memuat turun Amaterasu MT5 Bridge terkini...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "%B2_DIR%\amaterasu_mt5_bridge.py"

:: 4. Write Configuration for Account 2 (10,000 USC Cent Account)
echo [3/4] Menyediakan bridge_config.json untuk Master 2 (#5100207348)...
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':3,'max_slippage_pips':5,'magic_number':888998,'mt5_login':5100207348,'mt5_password':'mfd2e!3V','mt5_server':'VersusTrade-Live1','mt5_terminal_path':r'%T2_EXE%','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20}}; open(r'%B2_DIR%\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

:: 5. Launch Terminal 2
echo [4/4] Memulakan Terminal 2 & Bridge Master 2...
start "" "%T2_EXE%" /portable
timeout /t 3 >nul

title Amaterasu Bridge - Akaun 2 (#5100207348)
color 0A
cd /d %B2_DIR%
python amaterasu_mt5_bridge.py
pause
