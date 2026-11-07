[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "   AMATERASU X - 1-CLICK MULTI-ACCOUNT 2 INSTALLER" -ForegroundColor Green
Write-Host "   Akaun MT5: #5100207348 (Versus Trade 10,000 USC)" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

$acc2Dir = "C:\AmaterasuX_Acc2"
if (-not (Test-Path $acc2Dir)) {
    New-Item -ItemType Directory -Path $acc2Dir -Force | Out-Null
}

# 1. Identify Python 3
$pyCmd = $null
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $pyCmd = "python"
} elseif (Test-Path "C:\Program Files\Python311\python.exe") {
    $pyCmd = "C:\Program Files\Python311\python.exe"
} else {
    $pyCmd = "python"
}
Write-Host "[1/4] Python siap digunakan: $pyCmd" -ForegroundColor Green

# 2. Setup Independent Terminal 2
Write-Host "[2/4] Menyediakan Terminal MetaTrader 5 Kedua..." -ForegroundColor Cyan
$sourceMt5 = $null
$destMt5Dir = "C:\Program Files\Versus Trade MetaTrader 5 Terminal - Acc2"

if (Test-Path "C:\Program Files\Versus Trade MetaTrader 5 Terminal") {
    $sourceMt5 = "C:\Program Files\Versus Trade MetaTrader 5 Terminal"
} elseif (Test-Path "C:\Program Files\MetaTrader 5") {
    $sourceMt5 = "C:\Program Files\MetaTrader 5"
    $destMt5Dir = "C:\Program Files\MetaTrader 5 - Acc2"
}

if (-not (Test-Path "$destMt5Dir\terminal64.exe")) {
    if ($sourceMt5) {
        Write-Host "[INFO] Mengklon Terminal MT5 ke $destMt5Dir..." -ForegroundColor Yellow
        Copy-Item -Path $sourceMt5 -Destination $destMt5Dir -Recurse -Force
    } else {
        Write-Host "[INFO] Memuat turun terminal MT5 baharu..." -ForegroundColor Yellow
        $mt5Installer = "$env:TEMP\mt5setup.exe"
        (New-Object Net.WebClient).DownloadFile("https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe", $mt5Installer)
        Start-Process $mt5Installer -ArgumentList "/auto" -Wait
        $destMt5Dir = "C:\Program Files\MetaTrader 5"
    }
}
$mt5Acc2Exe = "$destMt5Dir\terminal64.exe"
Write-Host "[OK] Terminal MT5 Kedua bersedia: $mt5Acc2Exe" -ForegroundColor Green

# 3. Download Latest Bridge & Write Config
Write-Host "[3/4] Mengkonfigurasi Amaterasu Bridge Akaun #2..." -ForegroundColor Cyan
$wc = New-Object Net.WebClient
$wc.DownloadFile("https://amaterasux.onrender.com/amaterasu_mt5_bridge.py", "$acc2Dir\amaterasu_mt5_bridge.py")

$configJson = @"
{
  "server_url": "https://amaterasux.onrender.com",
  "lot_size": 0.2,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50,
  "max_concurrent_pairs": 3,
  "max_slippage_pips": 5,
  "magic_number": 888998,
  "mt5_login": 5100207348,
  "mt5_password": "mfd2e!3V",
  "mt5_server": "VersusTrade-Live1",
  "mt5_terminal_path": "$($mt5Acc2Exe.Replace('\', '\\'))",
  "allowed_pairs": [
    "XAUUSD",
    "USDCHF",
    "EURUSD"
  ],
  "custom_lot_map": {
    "XAUUSD": 0.2,
    "USDCHF": 0.2,
    "EURUSD": 0.2
  },
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.35,
  "dynamic_floating_atr": true
}
"@
Set-Content -Path "$acc2Dir\bridge_config.json" -Value $configJson -Encoding UTF8
Write-Host "[OK] Tetapan Akaun #5100207348 berjaya disimpan!" -ForegroundColor Green

# 4. Create Desktop 1-Click Launcher for BOTH Accounts
$desktopDir = [Environment]::GetFolderPath("Desktop")
$launcherContent = @"
@echo off
title AMATERASU X - MULTI-ACCOUNT DUAL RUNNER
color 0B
echo ===================================================================
echo     AMATERASU X - MEMULAKAN KEDUA-DUA AKAUN SERENTAK
echo     Akaun 1: #5100154135 (Master Live)
echo     Akaun 2: #5100207348 (Akaun Kedua 10,000 USC)
echo ===================================================================

:: 1. Jalankan Terminal MT5 Kedua jika belum running
start "" "$mt5Acc2Exe" /portable

timeout /t 3 >nul

:: 2. Buka Bridge Akaun 1 dalam tetingkap baharu
start "Amaterasu Bridge - Akaun 1 (#5100154135)" cmd /k "cd /d C:\AmaterasuX && python amaterasu_mt5_bridge.py"

:: 3. Buka Bridge Akaun 2 dalam tetingkap baharu
start "Amaterasu Bridge - Akaun 2 (#5100207348)" cmd /k "cd /d C:\AmaterasuX_Acc2 && python amaterasu_mt5_bridge.py"

echo.
echo [BERJAYA] Kedua-dua akaun kini berjalan serentak 24/7 di VPS!
pause
"@
Set-Content -Path "$desktopDir\START_AMATERASU_DUAL_ACCOUNTS.bat" -Value $launcherContent -Encoding ASCII
Write-Host "[OK] Shortcut pelancar dwi-akaun dicipta di Desktop!" -ForegroundColor Green

# 5. Launch Terminal 2 and Bridge 2
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "   MEMULAKAN TERMINAL 2 & BRIDGE AKAUN #5100207348" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

Start-Process $mt5Acc2Exe -ArgumentList "/portable"
Start-Sleep -Seconds 3

& $pyCmd -u "$acc2Dir\amaterasu_mt5_bridge.py"
