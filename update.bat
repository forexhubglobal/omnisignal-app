@echo off
title AMATERASU X - 1-CLICK 100% VPS AUTOMATION & SYNC
color 0A

echo ===============================================================================
echo          AMATERASU X - 100% AUTOMATION & VPS SYNCHRONIZATION ENGINE
echo ===============================================================================
echo.

:: 0. SUIS PAUSE AKAUN (1 = PAUSE / TIDAK DIJALANKAN, 0 = AKTIF)
:: Akaun 2 (MANTIS) baki 0 USC & Akaun 4 (MEZ EA) baki 19.22 USC - pause sehingga deposit semula.
set "PAUSE_ACC2=1"
set "PAUSE_ACC4=1"

:: 1. TUTUP SEMUA PYTHON BRIDGE LAMA DI VPS
echo [1/4] Menutup semua proses bridge lama di VPS...
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 >nul

:: 1.5 JIKA TERMINAL/BRIDGE AKAUN 5 BELUM WUJUD, LAKUKAN SETUP AUTOMATIK
if not exist "C:\AmaterasuX_Acc5\bridge_config.json" (
    if exist "%~dp0acc5.bat" (
        echo [INFO] Menyiapkan Akaun 5 (Wan Farouk $5k Standard) secara automatik...
        call "%~dp0acc5.bat"
    )
)

:: 2. KEMASKINI KOD JAMBATAN (DARI REPO TEMPATAN ATAU PELAYAN)
if exist "%~dp0amaterasu_mt5_bridge.py" (
    echo [2/4] Menyalin amaterasu_mt5_bridge.py terkini dari repositori tempatan...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$src = '%~dp0amaterasu_mt5_bridge.py'; ^
    $code = [System.IO.File]::ReadAllText($src); ^
    $dirs = @('C:\AmaterasuX', 'C:\AmaterasuX_Acc2', 'C:\AmaterasuX_Acc3', 'C:\AmaterasuX_Acc4', 'C:\AmaterasuX_Acc5', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master1_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master2_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master3_Standard'); ^
    foreach ($d in $dirs) { ^
        if (Test-Path $d) { ^
            $dest = Join-Path $d 'amaterasu_mt5_bridge.py'; ^
            [System.IO.File]::WriteAllText($dest, $code); ^
            Write-Host ('[OK] Updated local bridge in: ' + $dest) -ForegroundColor Green; ^
        } ^
    }"
) else (
    echo [2/4] Memuat turun amaterasu_mt5_bridge.py terkini dari pelayan pusat...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$url = 'https://amaterasux.com/amaterasu_mt5_bridge.py'; ^
    $code = (New-Object System.Net.WebClient).DownloadString($url); ^
    $dirs = @('C:\AmaterasuX', 'C:\AmaterasuX_Acc2', 'C:\AmaterasuX_Acc3', 'C:\AmaterasuX_Acc4', 'C:\AmaterasuX_Acc5', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master1_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master2_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master3_Standard'); ^
    foreach ($d in $dirs) { ^
        if (Test-Path $d) { ^
            $dest = Join-Path $d 'amaterasu_mt5_bridge.py'; ^
            [System.IO.File]::WriteAllText($dest, $code); ^
            Write-Host ('Updated bridge code in: ' + $dest) -ForegroundColor Green; ^
        } ^
    }"
)

:: 3. KEMASKINI SEMUA BRIDGE_CONFIG.JSON DI SELURUH VPS (LEPASKAN HAD LOT & SYNC SERVER)
echo.
echo [3/4] Mengemaskini semua bridge_config.json di seluruh VPS...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$files = Get-ChildItem -Path 'C:\' -Filter 'bridge_config.json' -Recurse -ErrorAction SilentlyContinue; ^
foreach ($f in $files) { ^
    try { ^
        $raw = [System.IO.File]::ReadAllText($f.FullName); ^
        $c = ConvertFrom-Json $raw; ^
        $c.server_url = 'https://amaterasux.com'; ^
        $c.auto_breakeven = $true; ^
        $c.execution_mode = 'SPLIT_TP'; ^
        $login = [string]$c.mt5_login; ^
        if ($login -match '5100242908') { ^
            $c.max_gold_positions = 10; ^
            $c.max_account_positions = 12; ^
            $c.max_account_lots = 1.00; ^
            $c.daily_profit_target_pct = 25.0; ^
            $c.daily_profit_target_usd = 1250.0; ^
        } elseif ($login -match '5100221532') { ^
            $c.max_gold_positions = 10; ^
            $c.max_account_positions = 12; ^
            $c.max_account_lots = 2.50; ^
            $c.daily_profit_target_pct = 25.0; ^
            $c.daily_profit_target_usc = 2500.0; ^
        } elseif ($login -match '5100221534|5100209626') { ^
            $c.max_gold_positions = 4; ^
            $c.max_account_positions = 8; ^
            $c.max_account_lots = 0.30; ^
            $c.daily_profit_target_pct = 25.0; ^
            $c.daily_profit_target_usd = 25.0; ^
        } else { ^
            $c.max_gold_positions = 4; ^
            $c.max_account_positions = 8; ^
            $c.max_account_lots = 1.50; ^
            $c.daily_profit_target_pct = 25.0; ^
            $c.daily_profit_target_usc = 2500.0; ^
        } ^
        $c | Add-Member -NotePropertyName omniquant_gatekeeper_enabled -NotePropertyValue $true -Force; ^
        $c | Add-Member -NotePropertyName omniquant_url -NotePropertyValue 'http://127.0.0.1:8005' -Force; ^
        $c | Add-Member -NotePropertyName omniquant_news_shield -NotePropertyValue $true -Force; ^
        $newJson = ConvertTo-Json $c -Depth 10; ^
        [System.IO.File]::WriteAllText($f.FullName, $newJson); ^
        Write-Host ('[OK] Synced max_lots & server in: ' + $f.FullName) -ForegroundColor Cyan; ^
    } catch {} ^
}"

:: 3.5 AUTO-SETUP & HIDUPKAN OMNIQUANT FX 24/7 (:8005 GATEKEEPER & :3005 WEB UI)
if exist "%~dp0omniquant-fx\auto_setup_vps.ps1" (
    echo.
    echo [OMNIQUANT] Menyelaraskan dan menghidupkan enjin OMNIQUANT FX 24/7...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0omniquant-fx\auto_setup_vps.ps1"
)

:: 4. MULAKAN SEMULA SEMUA BRIDGE DI VPS SECARA DETACHED
echo.
echo [4/4] Memulakan semula Bridge aktif di VPS...
timeout /t 2 >nul

set "PY=C:\Users\US\AppData\Local\Programs\Python\Python311\pythonw.exe"
if not exist "%PY%" set "PY=C:\Users\Administrator\AppData\Local\Programs\Python\Python311\pythonw.exe"
if not exist "%PY%" set "PY=C:\Program Files\Python311\pythonw.exe"
if not exist "%PY%" set "PY=python.exe"

if exist "C:\AmaterasuX\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX
    start "BRIDGE MASTER 1" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 1 (Dragon Cent)
)
timeout /t 1 >nul

if "%PAUSE_ACC2%"=="1" (
    echo [PAUSED] Bridge Master 2 ^(Mantis Cent^) - baki tiada, set PAUSE_ACC2=0 selepas deposit
) else if exist "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc2
    start "BRIDGE MASTER 2" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 2 (Mantis Cent)
)
timeout /t 1 >nul

if exist "C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc3
    start "BRIDGE MASTER 3" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 3 (Tiger Standard)
)
timeout /t 1 >nul

if "%PAUSE_ACC4%"=="1" (
    echo [PAUSED] Bridge Master 4 ^(MEZ EA Cent^) - baki tiada, set PAUSE_ACC4=0 selepas deposit
) else if exist "C:\AmaterasuX_Acc4\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc4
    start "BRIDGE MASTER 4" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 4 (MEZ EA Cent)
)
timeout /t 1 >nul

if exist "C:\AmaterasuX_Acc5\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc5
    start "BRIDGE MASTER 5" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 5 (Wan Farouk $5k Standard)
)

echo.
echo ===============================================================================
echo     SEMUA BRIDGE AKTIF DI VPS BERJAYA DISINKRONKAN 100%% DENGAN SERVER PUSAT!
echo ===============================================================================
echo.
timeout /t 5
