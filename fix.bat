@echo off
title AMATERASU X - AUTO UPDATE BRIDGE SCRIPT AND URL
color 0A

echo [1/2] Memuat turun fail Python Bridge terkini...
powershell -Command "irm https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py -OutFile $env:TEMP\bridge.py"

if exist "%TEMP%\bridge.py" (
    copy /y "%TEMP%\bridge.py" "C:\AmaterasuX\amaterasu_mt5_bridge.py" >nul
    copy /y "%TEMP%\bridge.py" "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py" >nul
    copy /y "%TEMP%\bridge.py" "C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py" >nul
    echo       [OK] Fail bridge telah dikemas kini ke versi bersih tanpa SyntaxError!
)

echo [2/2] Mengemas kini URL Pelayan untuk ketiga-tiga akaun...
powershell -Command "(Get-Content 'C:\AmaterasuX\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX\bridge_config.json'"
powershell -Command "(Get-Content 'C:\AmaterasuX_Acc2\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc2\bridge_config.json'"
powershell -Command "(Get-Content 'C:\AmaterasuX_Acc3\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc3\bridge_config.json'"

echo.
echo ===============================================================================
echo   BERJAYA! SEMUA KOD BRIDGE DAN KONFIGURASI AKAUN TELAH DIPERBAIKI!
echo ===============================================================================
echo.
pause
