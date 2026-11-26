@echo off
title OMNIQUANT FX - 24/7 VPS AUTO-RUNNER & BOOT INSTALLER
color 0B

echo =======================================================================
echo   OMNIQUANT FX x AMATERASU X - 24/7 VPS DEPLOYMENT LAUNCHER
echo =======================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Pastikan Python .venv dan pakej tersedia di VPS
if not exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    echo [1/4] Membuat Python virtual environment di VPS...
    python -m venv "%ROOT_DIR%backend\.venv"
    "%ROOT_DIR%backend\.venv\Scripts\python.exe" -m pip install -r "%ROOT_DIR%backend\requirements.txt"
)

:: 2. Pastikan Next.js dependencies & production build tersedia di VPS
if not exist "%ROOT_DIR%frontend\.next\BUILD_ID" (
    echo [2/4] Membina produksi Next.js di VPS...
    cd /d "%ROOT_DIR%frontend"
    call npm.cmd install
    call npm.cmd run build
    cd /d "%ROOT_DIR%"
)

:: 3. Daftar Auto-Start Windows Task Scheduler (supaya bila VPS reboot, dia auto ON sendiri!)
echo [3/4] Mendaftarkan Auto-Start 24/7 pada Windows Task Scheduler...
schtasks /Create /TN "OmniQuantFX_24_7" /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File \"%ROOT_DIR%vps_watchdog.ps1\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1

:: 4. Jalankan Watchdog 24/7 sekarang
echo [4/4] Memulakan Watchdog 24/7 (Auto-Restart jika crash)...
start "OMNIQUANT-24-7-WATCHDOG" powershell.exe -ExecutionPolicy Bypass -NoExit -File "%ROOT_DIR%vps_watchdog.ps1"

echo.
echo [SIAP!] OMNIQUANT FX kini aktif 24/7 di http://127.0.0.1:3005
echo Sambungkan subdomain (cth: quant.amaterasux.com) ke http://127.0.0.1:3005 dalam Cloudflare Tunnel!
timeout /t 5
