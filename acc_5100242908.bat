@echo off
title AMATERASU X - MASTER 5 SETUP ^& RUNNER (#5100242908 WAN FAROUK $5K)
color 0B
echo =====================================================================
echo       AMATERASU X - SETUP MASTER 5 TERMINAL ^& BRIDGE (#5100242908)
echo             WAN FAROUK FIRDAUS BIN WAN ARIFIN ($5,000 STANDARD)
echo =====================================================================
echo.

:: 1. Setup Terminal 5 Folder
set "T5_DIR=C:\VersusTrade_Acc5"
set "T5_EXE=%T5_DIR%\terminal64.exe"

if not exist "%T5_EXE%" (
  echo [1/4] Mengklon Terminal MT5 ke %T5_DIR%...
  if exist "C:\VersusTrade_Acc4" (
    xcopy /E /I /Y "C:\VersusTrade_Acc4" "%T5_DIR%\" >nul
  ) else if exist "C:\VersusTrade_Acc3" (
    xcopy /E /I /Y "C:\VersusTrade_Acc3" "%T5_DIR%\" >nul
  ) else if exist "C:\VersusTrade_Acc2" (
    xcopy /E /I /Y "C:\VersusTrade_Acc2" "%T5_DIR%\" >nul
  ) else if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal" (
    xcopy /E /I /Y "C:\Program Files\Versus Trade MetaTrader 5 Terminal" "%T5_DIR%\" >nul
  ) else if exist "C:\Program Files\MetaTrader 5" (
    xcopy /E /I /Y "C:\Program Files\MetaTrader 5" "%T5_DIR%\" >nul
  )
)

if exist "%T5_EXE%" (
  echo [OK] Terminal MT5 5 Bersedia di %T5_EXE%
) else (
  set "T5_EXE=C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
)

:: 2. Setup Bridge Folder
set "B5_DIR=C:\AmaterasuX_Acc5"
if not exist "%B5_DIR%" mkdir "%B5_DIR%"

:: 3. Download Latest Bridge
echo [2/4] Memuat turun Amaterasu MT5 Bridge terkini...
curl -s -L "https://amaterasux.com/amaterasu_mt5_bridge.py" -o "%B5_DIR%\amaterasu_mt5_bridge.py"

:: 4. Write Configuration for Account 5 ($5,000 USD Standard Account)
echo [3/4] Menyediakan bridge_config.json untuk Master 5 (#5100242908)...
python -c "import json, os; cfg={'server_url':'https://amaterasux.com','lot_size':0.05,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':35.0,'max_concurrent_pairs':4,'max_gold_positions':10,'max_account_positions':12,'max_account_lots':1.00,'daily_profit_target_pct':25.0,'daily_profit_target_usd':1250.0,'max_slippage_pips':10,'magic_number':888995,'mt5_login':5100242908,'mt5_password':r'>.=m0^nB?.L1','mt5_server':'VersusTrade-Live1','mt5_terminal_path':r'%T5_EXE%','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.05,'USDCHF':0.05,'EURUSD':0.05},'dynamic_floating_atr':True}; open(r'%B5_DIR%\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

:: 5. Launch Terminal & Bridge
echo [4/4] Memulakan Terminal MT5 Acc5 & Bridge...
if exist "%T5_EXE%" (
  start "" "%T5_EXE%" /portable
  timeout /t 3 >nul
)

cd /d "%B5_DIR%"
python amaterasu_mt5_bridge.py
pause
