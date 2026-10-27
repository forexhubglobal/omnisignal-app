@echo off
title AMATERASU X - MT5 AUTO EXECUTION BRIDGE
color 0C

echo =====================================================================
echo           AMATERASU X - MT5 AUTO EXECUTION BRIDGE (PYTHON)
echo =====================================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemui dalam sistem anda!
    echo Sila muat turun dan pasang Python dari https://www.python.org/
    echo Pastikan tandakan kotak 'Add python.exe to PATH' semasa pemasangan.
    pause
    exit /b
)

:: Install / Verify required dependencies
echo [1/2] Menyemak modul MetaTrader5 ^& requests...
pip install MetaTrader5 requests --quiet

:: Launch the bridge
echo [2/2] Memulakan Amaterasu MT5 Bridge...
echo.
python -u amaterasu_mt5_bridge.py

if %errorlevel% neq 0 (
    echo.
    echo Bridge ditamatkan atau berlaku ralat.
)

pause
