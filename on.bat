@echo off
title OMNIQUANT FX x AMATERASU X - 1-CLICK VPS SYNC & ACTIVATE
color 0A

git -C "%~dp0" config core.hooksPath .githooks >nul 2>&1

:: 1. Stop old MT5 Bridge Python/Pythonw processes in RAM so new Auto-Scalp code loads 100% fresh!
echo [1/4] Menutup proses Bridge MT5 lama dalam RAM...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'amaterasu_mt5_bridge\.py' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 2 >nul

:: 2. Sync latest amaterasu_mt5_bridge.py & update Account 5 config + clear stale Acc5 pause flag
echo [2/4] Mengemas kini amaterasu_mt5_bridge.py ^& konfigurasi Akaun 5...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$src = '%~dp0amaterasu_mt5_bridge.py'; ^
if (Test-Path $src) { ^
    $code = [System.IO.File]::ReadAllText($src); ^
    $dirs = @('C:\AmaterasuX', 'C:\AmaterasuX_Acc1', 'C:\AmaterasuX_Acc3', 'C:\AmaterasuX_Acc5'); ^
    foreach ($d in $dirs) { ^
        if (Test-Path $d) { ^
            [System.IO.File]::WriteAllText((Join-Path $d 'amaterasu_mt5_bridge.py'), $code); ^
            $cfgPath = Join-Path $d 'bridge_config.json'; ^
            if (Test-Path $cfgPath) { ^
                try { ^
                    $c = ConvertFrom-Json ([System.IO.File]::ReadAllText($cfgPath)); ^
                    $c | Add-Member -NotePropertyName omniquant_gatekeeper_enabled -NotePropertyValue $true -Force; ^
                    $c | Add-Member -NotePropertyName omniquant_url -NotePropertyValue 'http://127.0.0.1:8005' -Force; ^
                    $c | Add-Member -NotePropertyName omniquant_news_shield -NotePropertyValue $false -Force; ^
                    if ([string]$c.mt5_login -match '5100242908') { ^
                        $c | Add-Member -NotePropertyName max_gold_positions -NotePropertyValue 16 -Force; ^
                        $c | Add-Member -NotePropertyName max_account_positions -NotePropertyValue 24 -Force; ^
                        $c | Add-Member -NotePropertyName max_account_lots -NotePropertyValue 1.50 -Force; ^
                    } ^
                    [System.IO.File]::WriteAllText($cfgPath, (ConvertTo-Json $c -Depth 10)); ^
                } catch {} ^
            } ^
            Write-Host ('[OK] Bridge synced: ' + $d) -ForegroundColor Green; ^
        } ^
    } ^
} ^
if (Test-Path 'C:\AmaterasuX_Acc5\pause_trading.flag') { Remove-Item 'C:\AmaterasuX_Acc5\pause_trading.flag' -Force -ErrorAction SilentlyContinue }"

:: 3. Launch / Restart OMNIQUANT FX Unified Server (:3005 & :8005) + 24/7 Watchdog
echo [3/4] Menghidupkan pelayan OMNIQUANT FX (:3005 ^& :8005)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0omniquant-fx\auto_setup_vps.ps1"

:: 4. Start fresh MT5 Bridges in RAM (Account 1 = LOCKED OFF, Account 5 = ACTIVE ON)
echo [4/4] Memulakan semula Bridge MT5 dengan enjin Auto-Scalp OMNIQUANT...
set "PY=C:\Users\Administrator\AppData\Local\Programs\Python\Python311\pythonw.exe"
if not exist "%PY%" set "PY=C:\Users\US\AppData\Local\Programs\Python\Python311\pythonw.exe"
if not exist "%PY%" set "PY=C:\Program Files\Python311\pythonw.exe"
if not exist "%PY%" set "PY=python.exe"

if exist "C:\AmaterasuX\amaterasu_mt5_bridge.py" (
    start "BRIDGE MASTER 1" /D "C:\AmaterasuX" "%PY%" "C:\AmaterasuX\amaterasu_mt5_bridge.py"
    echo [OK] Bridge Master 1 dimulakan ^(TRADE: OFF^)
)
if exist "C:\AmaterasuX_Acc5\amaterasu_mt5_bridge.py" (
    start "BRIDGE MASTER 5" /D "C:\AmaterasuX_Acc5" "%PY%" "C:\AmaterasuX_Acc5\amaterasu_mt5_bridge.py"
    echo [OK] Bridge Master 5 dimulakan ^(TRADE: ON - AUTO SCALP AKTIF!^)
)

echo.
echo [SIAP 100%%] Enjin Auto-Scalp OMNIQUANT FX ^> MT5 Akaun 5 kini aktif sepenuhnya!
timeout /t 3 >nul
