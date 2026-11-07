@echo off
title AMATERASU X - QUICK FIX & AUTO RUNNER
color 0A
echo ===================================================================
echo   AMATERASU X - KEMASKINI & JALANKAN BRIDGE AKAUN 2 (#5100207348)
echo ===================================================================
echo.
echo [1/3] Menghentikan sebarang bridge lama yang tersangkut...
taskkill /F /FI "WINDOWTITLE eq Amaterasu Bridge - Akaun 2*" >nul 2>&1

echo [2/3] Memuat turun bridge terkini dari Render...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py"

echo [3/3] Memulakan Bridge Akaun 2...
cd /d C:\AmaterasuX_Acc2
python amaterasu_mt5_bridge.py

pause
