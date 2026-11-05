@echo off
title AMATERASU X - AUTOMATED VPS INSTALLER
color 0A

echo =====================================================================
echo       AMATERASU X - 1-CLICK AUTOMATED VPS INSTALLER
echo =====================================================================
echo.

if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"
cd /d "C:\AmaterasuX"

:: 1. ENSURE PYTHON 3.11 64-BIT IS INSTALLED
echo [1/4] Menyemak Python 3.11 64-bit...
if exist "C:\Program Files\Python311\python.exe" goto py311_ok

echo [INFO] Memasang Python 3.11 64-bit rasmi untuk MetaTrader 5...
curl -s -L "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -o "%TEMP%\py311.exe"
echo [INFO] Sila tunggu 15 saat pemasangan senyap...
"%TEMP%\py311.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1
timeout /t 10 >nul

:py311_ok
set "PYCMD=C:\Program Files\Python311\python.exe"
if not exist "%PYCMD%" set "PYCMD=python"
echo [OK] Python siap digunakan: %PYCMD%

:: 2. INSTALL REQUIRED MODULES
echo [2/4] Memasang modul requests dan MetaTrader5...
"%PYCMD%" -m pip install --upgrade pip --quiet
"%PYCMD%" -m pip install requests --quiet
"%PYCMD%" -m pip install MetaTrader5 --quiet
echo [OK] Modul python sedia digunakan.

:: 3. DOWNLOAD AND INSTALL MT5 IF NOT PRESENT
echo [3/4] Menyemak terminal MetaTrader 5...
if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" goto mt5_ok
if exist "C:\Program Files\MetaTrader 5\terminal64.exe" goto mt5_ok

echo [INFO] Memuat turun MetaTrader 5 setup...
curl -s -L "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe" -o "%TEMP%\mt5setup.exe"
echo [INFO] Memasang MetaTrader 5...
start /wait "" "%TEMP%\mt5setup.exe" /auto

:mt5_ok
echo [OK] Terminal MetaTrader 5 sedia ada!

:: 4. DOWNLOAD LATEST BRIDGE FILES
echo [4/4] Memuat turun Amaterasu X Bridge terkini...
curl -s -L "https://amaterasux.onrender.com/amaterasu_mt5_bridge.py" -o "C:\AmaterasuX\amaterasu_mt5_bridge.py"
curl -s -L "https://amaterasux.onrender.com/bridge_config.json" -o "C:\AmaterasuX\bridge_config.json"
echo [OK] Fail Bridge siap dimuat turun!

:: 5. LAUNCH MT5 AND BRIDGE
echo.
echo =====================================================================
echo    PEMASANGAN SELESAI! MEMULAKAN AMATERASU MT5 BRIDGE SEKARANG...
echo =====================================================================
echo.

if exist "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" (
    start "" "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
) else if exist "C:\Program Files\MetaTrader 5\terminal64.exe" (
    start "" "C:\Program Files\MetaTrader 5\terminal64.exe"
)

timeout /t 3 >nul
"%PYCMD%" -u "C:\AmaterasuX\amaterasu_mt5_bridge.py"
pause
