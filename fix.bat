@echo off
title AMATERASU X - AUTO UPDATE BRIDGE SERVER URL
color 0A

echo Mengemas kini URL Pelayan untuk ketiga-tiga akaun...

powershell -Command "(Get-Content 'C:\AmaterasuX\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX\bridge_config.json'"

powershell -Command "(Get-Content 'C:\AmaterasuX_Acc2\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc2\bridge_config.json'"

powershell -Command "(Get-Content 'C:\AmaterasuX_Acc3\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc3\bridge_config.json'"

echo.
echo ===============================================================================
echo   BERJAYA! Ketiga-tiga konfigurasi akaun telah dikemas kini ke Cloudflare.
echo ===============================================================================
echo.
pause
