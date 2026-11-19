@echo off
title AMATERASU X - 100%% AUTONOMOUS STANDALONE VPS (24/7 INDEPENDENT)
color 0A

echo ===============================================================================
echo        AMATERASU X - 24/7 AUTONOMOUS VPS SYSTEM (STANDALONE ZERO-PC)
echo ===============================================================================
echo.

:: 1. HENTIKAN PROSES LAMA
echo [1/6] Menghentikan proses lama di VPS...
reg add HKCU\Console /v QuickEdit /t REG_DWORD /d 0 /f >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM pythonw.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Bridge Master*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Amaterasu Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Cloudflare Tunnel*" >nul 2>&1
timeout /t 2 >nul

:: 2. SEDIAKAN STRUKTUR DIREKTORI
echo [2/6] Menyediakan direktori sistem Amaterasu X...
if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"
if not exist "C:\AmaterasuX\tools" mkdir "C:\AmaterasuX\tools"
if not exist "C:\AmaterasuX\data" mkdir "C:\AmaterasuX\data"
if not exist "C:\AmaterasuX_Acc2" mkdir "C:\AmaterasuX_Acc2"
if not exist "C:\AmaterasuX_Acc3" mkdir "C:\AmaterasuX_Acc3"
if not exist "C:\AmaterasuX_Acc4" mkdir "C:\AmaterasuX_Acc4"

:: 3. MUAT TURUN FAIL OTAK DAN ENGINE DARI SERVER
echo [3/6] Memuat turun fail Otak Server dan Bridge terkini...
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX\server.js "https://amaterasux.com/server.js?v=%random%"
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX\data\db.json "https://amaterasux.com/data/db.json?v=%random%"
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX\amaterasu_mt5_bridge.py "https://amaterasux.com/amaterasu_mt5_bridge.py?v=%random%"
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py "https://amaterasux.com/amaterasu_mt5_bridge.py?v=%random%"
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py "https://amaterasux.com/amaterasu_mt5_bridge.py?v=%random%"
curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX_Acc4\amaterasu_mt5_bridge.py "https://amaterasux.com/amaterasu_mt5_bridge.py?v=%random%"

:: 3.1 SEMAK / MUAT TURUN NODE.EXE DAN CLOUDFLARED.EXE (JIKA BELUM ADA)
if not exist "C:\AmaterasuX\node.exe" (
    echo       [DOWNLOAD] Memuat turun Node.js standalone engine...
    curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX\node.exe "https://amaterasux.com/node.exe"
)
if not exist "C:\AmaterasuX\tools\cloudflared.exe" (
    echo       [DOWNLOAD] Memuat turun Cloudflare Tunnel engine...
    curl -s -k -A "Mozilla/5.0" -o C:\AmaterasuX\tools\cloudflared.exe "https://amaterasux.com/cloudflared.exe"
)

:: 4. JALANKAN OTAK PELAYAN (SERVER.JS) DAN TEROWONG CLOUDFLARE DI VPS
echo [4/6] Menjalankan Otak Pelayan Amaterasu X & Cloudflare Tunnel 24/7 di VPS...
set "NODE_CMD=node"
if exist "C:\AmaterasuX\node.exe" set "NODE_CMD=C:\AmaterasuX\node.exe"

cd /d C:\AmaterasuX
start "Amaterasu Server (Port 3000)" /min cmd /c "%NODE_CMD% server.js"
timeout /t 3 >nul

if exist "C:\AmaterasuX\tools\cloudflared.exe" (
    start "Cloudflare Tunnel (amaterasux.com)" /min cmd /c "C:\AmaterasuX\tools\cloudflared.exe tunnel run --token eyJhIjoiZDJkMTY3OWU2MGQwZmQzMzVlMTU5ZTQyYTBmMjZkMjAiLCJ0IjoiZTkxZmFiYzYtNzA0NC00ODJkLWJlYzktMDA3MjI1OWMyMzJiIiwicyI6Ik5tTTVPVEZtTkdRdE1XSXhOaTAwT0RjNExXSmpNR0l0T1dJMVptRmlOelEyWVdVNCJ9"
    timeout /t 2 >nul
)

:: 5. INJECT KONFIGURASI 4 AKAUN TERUS KE 127.0.0.1 (0MS LOCAL VPS CONNECTION)
echo [5/6] Menyuntik konfigurasi 4 akaun MT5 terus ke pelayan lokal VPS...
python -c "import json, os; p=r'C:\VersusTrade_Acc1\terminal64.exe' if os.path.exists(r'C:\VersusTrade_Acc1\terminal64.exe') else r'C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe'; cfg={'server_url':'http://127.0.0.1:3000','mt5_terminal_path':p,'lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':False,'gold_min_be_pips':50.0,'max_gold_positions':9,'max_account_positions':20,'max_concurrent_pairs':4,'max_account_lots':5.0,'max_slippage_pips':30,'magic_number':888999,'mt5_login':5100221532,'mt5_password':'Tengku1990@','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20},'custom_symbol_map':{'XAUUSD':'XAUUSD.c','EURUSD':'EURUSD.c','USDCHF':'USDCHF.c'}}; open(r'C:\AmaterasuX\bridge_config.json','w').write(json.dumps(cfg,indent=2))" >nul 2>&1
python -c "import json; cfg={'server_url':'http://127.0.0.1:3000','mt5_terminal_path':r'C:\VersusTrade_Acc2\terminal64.exe','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':False,'gold_min_be_pips':50.0,'max_gold_positions':9,'max_account_positions':20,'max_concurrent_pairs':4,'max_account_lots':5.0,'max_slippage_pips':30,'magic_number':888998,'mt5_login':5100221533,'mt5_password':'o6019f!F','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20},'custom_symbol_map':{'XAUUSD':'XAUUSD.c','EURUSD':'EURUSD.c','USDCHF':'USDCHF.c'}}; open(r'C:\AmaterasuX_Acc2\bridge_config.json','w').write(json.dumps(cfg,indent=2))" >nul 2>&1
python -c "import json; cfg={'server_url':'http://127.0.0.1:3000','mt5_terminal_path':r'C:\VersusTrade_Acc3\terminal64.exe','lot_size':0.02,'execution_mode':'SPLIT_TP','auto_breakeven':False,'gold_min_be_pips':50.0,'max_gold_positions':9,'max_account_positions':20,'max_concurrent_pairs':4,'max_account_lots':0.50,'max_slippage_pips':30,'magic_number':888997,'mt5_login':5100221534,'mt5_password':'Tengku1990@','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.02,'USDCHF':0.03,'EURUSD':0.03},'custom_symbol_map':{'XAUUSD':'XAUUSD.s','EURUSD':'EURUSD.s','USDCHF':'USDCHF.s'}}; open(r'C:\AmaterasuX_Acc3\bridge_config.json','w').write(json.dumps(cfg,indent=2))" >nul 2>&1
python -c "import json; cfg={'server_url':'http://127.0.0.1:3000','mt5_terminal_path':r'C:\VersusTrade_Acc4\terminal64.exe','lot_size':0.20,'execution_mode':'SPLIT_TP','auto_breakeven':False,'gold_min_be_pips':50.0,'max_gold_positions':9,'max_account_positions':20,'max_concurrent_pairs':4,'max_account_lots':5.0,'max_slippage_pips':30,'magic_number':888994,'mt5_login':5100227599,'mt5_password':'!b4354Q0','mt5_server':'VersusTrade-Live1','allowed_pairs':['XAUUSD','USDCHF','EURUSD'],'custom_lot_map':{'XAUUSD':0.20,'USDCHF':0.20,'EURUSD':0.20},'custom_symbol_map':{'XAUUSD':'XAUUSD.c','EURUSD':'EURUSD.c','USDCHF':'USDCHF.c'}}; open(r'C:\AmaterasuX_Acc4\bridge_config.json','w').write(json.dumps(cfg,indent=2))" >nul 2>&1

:: 6. BUKA DAN LOG MASUK SEMUA TERMINAL MT5 SECARA AUTOMATIK
echo [6/6] Membuka 4 Terminal MT5 dan 4 AI Bridge...
if exist "C:\VersusTrade_Acc1\terminal64.exe" (
    start "" "C:\VersusTrade_Acc1\terminal64.exe" /portable /login:5100221532 /password:Tengku1990@ /server:VersusTrade-Live1
) else (
    if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" (
        start "" "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" /login:5100221532 /password:Tengku1990@ /server:VersusTrade-Live1
    )
)
timeout /t 2 >nul

if exist "C:\VersusTrade_Acc2\terminal64.exe" (
    start "" "C:\VersusTrade_Acc2\terminal64.exe" /portable /login:5100221533 /password:o6019f!F /server:VersusTrade-Live1
)
timeout /t 2 >nul

if exist "C:\VersusTrade_Acc3\terminal64.exe" (
    start "" "C:\VersusTrade_Acc3\terminal64.exe" /portable /login:5100221534 /password:Tengku1990@ /server:VersusTrade-Live1
)
timeout /t 2 >nul

if exist "C:\VersusTrade_Acc4\terminal64.exe" (
    start "" "C:\VersusTrade_Acc4\terminal64.exe" /portable /login:5100227599 /password:!b4354Q0 /server:VersusTrade-Live1
)
timeout /t 3 >nul

:: JALANKAN 4 AI BRIDGE MT5
if exist "C:\AmaterasuX\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX
    start "Bridge Master 1 (#5100221532)" python amaterasu_mt5_bridge.py
)
timeout /t 1 >nul

if exist "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc2
    start "Bridge Master 2 (#5100221533)" python amaterasu_mt5_bridge.py
)
timeout /t 1 >nul

if exist "C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc3
    start "Bridge Master 3 (#5100221534)" python amaterasu_mt5_bridge.py
)
timeout /t 1 >nul

if exist "C:\AmaterasuX_Acc4\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc4
    start "Bridge Master 4 (#5100227599)" python amaterasu_mt5_bridge.py
)

echo.
echo ===============================================================================
echo     TAHNIAH! SISTEM AMATERASU X KINI 100%% MANDIRI BERJALAN 24/7 DI VPS!
echo     TENGKU BOLEH TUTUP PC RUMAH SEPENUHNYA TANPA SEBARANG GANGGUAN!
echo     LAMAN WEB: https://amaterasux.com (BOLEH DIAKSES DARI HANDPHONE 24/7)
echo ===============================================================================
echo.
timeout /t 10
