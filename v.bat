@echo off
title AMATERASU X - AUTOMATED VPS INSTALLER
color 0A

echo =====================================================================
echo       AMATERASU X - 1-CLICK AUTOMATED VPS INSTALLER
echo =====================================================================
echo.

if not exist "C:\AmaterasuX" mkdir "C:\AmaterasuX"
cd /d "C:\AmaterasuX"

:: 1. CHECK AND INSTALL PYTHON AUTOMATICALLY
echo [1/4] Menyemak status Python...
python --version >nul 2>&1
if %errorlevel% equ 0 goto python_ok

echo [INFO] Python tidak ditemui. Memuat turun Python 3.11...
curl -s -L "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe" -o "%TEMP%\py.exe"
echo [INFO] Memasang Python secara senyap...
"%TEMP%\py.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1
timeout /t 5 >nul
set "PATH=C:\Program Files\Python311;C:\Program Files\Python311\Scripts;%PATH%"

:python_ok
echo [OK] Python sedia digunakan!

:: 2. INSTALL REQUIRED MODULES
echo [2/4] Memasang modul MetaTrader5 dan requests...
python -m pip install --upgrade pip --quiet
python -m pip install MetaTrader5 requests --quiet
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
echo [4/4] Memuat turun Amaterasu X Bridge...
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
python -u "C:\AmaterasuX\amaterasu_mt5_bridge.py"
pause
