@echo off
title AMATERASU X - MASTER 3 SETUP ^& RUNNER
color 0E
echo =====================================================================
echo       AMATERASU X - SETUP MASTER 3 TERMINAL ^& BRIDGE (#5100209626)
echo =====================================================================
echo.

:: 1. Setup Terminal 3 Folder
set "T3_DIR=C:\VersusTrade_Acc3"
set "T3_EXE=%T3_DIR%\terminal64.exe"

if not exist "%T3_EXE%" (
  echo [1/4] Mengklon Terminal MT5 ke %T3_DIR%...
  if exist "C:\VersusTrade_Acc2" (
    xcopy /E /I /Y "C:\VersusTrade_Acc2" "%T3_DIR%\" >nul
  ) else if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal" (
    xcopy /E /I /Y "C:\Program Files\Versus Trade MetaTrader 5 Terminal" "%T3_DIR%\" >nul
  ) else if exist "C:\Program Files\MetaTrader 5" (
    xcopy /E /I /Y "C:\Program Files\MetaTrader 5" "%T3_DIR%\" >nul
  )
)

if exist "%T3_EXE%" (
  echo [OK] Terminal MT5 3 Bersedia di %T3_EXE%
) else (
  echo [RALAT] Gagal mengklon Terminal MT5. Sila pastikan MT5 ada di C:\Program Files.
)

:: 2. Setup Bridge Folder
set "B3_DIR=C:\AmaterasuX_Acc3"
if not exist "%B3_DIR%" mkdir "%B3_DIR%"

:: 3. Download Latest Bridge
echo [2/4] Memuat turun Amaterasu MT5 Bridge terkini...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "%B3_DIR%\amaterasu_mt5_bridge.py"

:: 4. Write Configuration for Account 3 ($1,000 USD Standard Account)
echo [3/4] Menyediakan bridge_config.json untuk Master 3 (#5100209626)...
python -c "import json, os; cfg={'server_url':'https://amaterasux.onrender.com','lot_size':0.02,'execution_mode':'SPLIT_TP','auto_breakeven':True,'gold_min_be_pips':50.0,'max_concurrent_pairs':3,'max_slippage_pips':5,'magic_number':888997,'mt5_login':5100209626,'mt5_password':'5t6639B!','mt5_server':'VersusTrade-Live1','mt5_terminal_path':r'%T3_EXE%','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.02,'USDCHF':0.03,'EURUSD':0.03},'ny_gold_multiplier_active':True,'ny_gold_lot_size':0.03,'dynamic_floating_atr':True}; open(r'%B3_DIR%\bridge_config.json','w').write(json.dumps(cfg,indent=2))"

:: 5. Launch Terminal 3
echo [4/4] Memulakan Terminal 3 ^& Bridge Master 3...
start "" "%T3_EXE%" /portable
timeout /t 3 >nul

:: 6. Launch Bridge in separate window
start "Amaterasu Bridge - Akaun 3 (#5100209626)" cmd /k "cd /d %B3_DIR% && python amaterasu_mt5_bridge.py"

echo.
echo =====================================================================
echo  [SELESAI] Terminal 3 ^& Bridge Master 3 Berjaya Dimulakan!
echo  Akaun #5100209626 ($1,000 USD) sedia mengeksekusi dagangan!
echo  Pastikan butang 'Algo Trading' pada bar alat MT5 berwarna HIJAU!
echo =====================================================================
pause
