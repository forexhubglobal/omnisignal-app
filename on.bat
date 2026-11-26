@echo off
title OMNIQUANT FX x AMATERASU X - 1-CLICK VPS SYNC & ACTIVATE
color 0A

git -C "%~dp0" config core.hooksPath .githooks >nul 2>&1

:: 1. Sync latest amaterasu_mt5_bridge.py to C:\AmaterasuX (triggers 30s OTA Auto-Sync on Acc 1 & Acc 5!)
echo [SYNC] Mengemas kini amaterasu_mt5_bridge.py untuk Akaun 1 ^& Akaun 5 (OTA Auto-Sync)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$src = '%~dp0amaterasu_mt5_bridge.py'; ^
if (Test-Path $src) { ^
    $code = [System.IO.File]::ReadAllText($src); ^
    $dirs = @('C:\AmaterasuX', 'C:\AmaterasuX_Acc1', 'C:\AmaterasuX_Acc3', 'C:\AmaterasuX_Acc5'); ^
    foreach ($d in $dirs) { ^
        if (Test-Path $d) { ^
            [System.IO.File]::WriteAllText((Join-Path $d 'amaterasu_mt5_bridge.py'), $code); ^
            Write-Host ('[OK] Bridge synced: ' + $d) -ForegroundColor Green; ^
        } ^
    } ^
}"

:: 2. Launch / Restart OMNIQUANT FX Unified Server (:3005 & :8005)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0omniquant-fx\auto_setup_vps.ps1"
