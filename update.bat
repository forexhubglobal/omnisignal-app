@echo off
title AMATERASU X - 1-CLICK 100% VPS AUTOMATION & SYNC
color 0A

echo ===============================================================================
echo          AMATERASU X - 100% AUTOMATION & VPS SYNCHRONIZATION ENGINE
echo ===============================================================================
echo.

:: 1. TUTUP SEMUA PYTHON BRIDGE LAMA DI VPS
echo [1/4] Menutup semua proses bridge lama di VPS...
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 >nul

:: 2. MUAT TURUN KOD JAMBATAN TERKINI DARI SERVER AMATERASU X
echo [2/4] Memuat turun amaterasu_mt5_bridge.py terkini dari https://amaterasux.com...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$url = 'https://amaterasux.com/amaterasu_mt5_bridge.py'; ^
$code = (New-Object System.Net.WebClient).DownloadString($url); ^
$dirs = @('C:\AmaterasuX', 'C:\AmaterasuX_Acc2', 'C:\AmaterasuX_Acc3', 'C:\AmaterasuX_Acc4', 'C:\AmaterasuX_270588', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master1_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master2_Cent', 'C:\Users\Administrator\Desktop\AMATERASU_VPS_PACKAGE\Master3_Standard'); ^
foreach ($d in $dirs) { ^
    if (Test-Path $d) { ^
        $dest = Join-Path $d 'amaterasu_mt5_bridge.py'; ^
        [System.IO.File]::WriteAllText($dest, $code); ^
        Write-Host ('Updated bridge code in: ' + $dest) -ForegroundColor Green; ^
    } ^
}"

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
        if ($login -match '5100221534|5100209626') { ^
            $c.max_account_lots = 0.20; ^
        } else { ^
            $c.max_account_lots = 1.50; ^
        } ^
        $c.max_account_positions = 15; ^
        $newJson = ConvertTo-Json $c -Depth 10; ^
        [System.IO.File]::WriteAllText($f.FullName, $newJson); ^
        Write-Host ('[OK] Synced max_lots & server in: ' + $f.FullName) -ForegroundColor Cyan; ^
    } catch {} ^
}"

:: 4. MULAKAN SEMULA SEMUA BRIDGE DI VPS SECARA DETACHED
echo.
echo [4/4] Memulakan semula semua 4 Bridge di VPS...
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

if exist "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py" (
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

if exist "C:\AmaterasuX_Acc4\amaterasu_mt5_bridge.py" (
    cd /d C:\AmaterasuX_Acc4
    start "BRIDGE MASTER 4" %PY% amaterasu_mt5_bridge.py
    echo [RUNNING] Bridge Master 4 (MEZ EA Cent)
)

echo.
echo ===============================================================================
echo     SEMUA 4 BRIDGE DI VPS BERJAYA DISINKRONKAN 100%% DENGAN AMATERASUX.COM!
echo ===============================================================================
echo.
timeout /t 5
