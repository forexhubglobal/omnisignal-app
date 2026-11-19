Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "    AMATERASU X - 1-CLICK VPS 4 MASTER ACCOUNTS HARD-SYNC & LAUNCHER" -ForegroundColor Cyan
Write-Host "===============================================================================`n" -ForegroundColor Cyan

Write-Host "1. Menutup semua tetingkap MT5 dan bridge lama di VPS..." -ForegroundColor Yellow
taskkill /F /IM python.exe 2>$null
taskkill /F /IM terminal64.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "2. Mencari fail terminal64.exe asas di VPS..." -ForegroundColor Cyan
$baseExe = $null
$candidates = @(
    'C:\VersusTrade_Acc3\terminal64.exe',
    'C:\VersusTrade_Acc2\terminal64.exe',
    'C:\VersusTrade_Acc1\terminal64.exe',
    'C:\VersusTrade_Acc4\terminal64.exe',
    'C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe',
    'C:\Program Files\MetaTrader 5\terminal64.exe'
)
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $baseExe = $c
        Write-Host "   [JUMPA] Sumber MT5 asas: $c" -ForegroundColor Green
        break
    }
}

if (-not $baseExe) {
    Write-Host "   [INFO] Mencari terminal64.exe di seluruh pemacu C:..." -ForegroundColor Yellow
    $found = Get-ChildItem -Path 'C:\' -Filter 'terminal64.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $baseExe = $found.FullName }
}

$baseDir = Split-Path $baseExe

Write-Host "3. Memastikan keempat-empat folder instalasi MT5 sedia ada (Acc1, Acc2, Acc3, Acc4)..." -ForegroundColor Cyan

# Klon Acc1 jika tiada
if (-not (Test-Path 'C:\VersusTrade_Acc1\terminal64.exe')) {
    Write-Host "   [INFO] Menyediakan Terminal 1 di C:\VersusTrade_Acc1..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path 'C:\VersusTrade_Acc1' | Out-Null
    Copy-Item -Path "$baseDir\*" -Destination 'C:\VersusTrade_Acc1' -Recurse -Force
    Write-Host "   [OK] Folder C:\VersusTrade_Acc1 berjaya dicipta!" -ForegroundColor Green
}

# Klon Acc2 jika tiada
if (-not (Test-Path 'C:\VersusTrade_Acc2\terminal64.exe')) {
    Write-Host "   [INFO] Menyediakan Terminal 2 di C:\VersusTrade_Acc2..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path 'C:\VersusTrade_Acc2' | Out-Null
    Copy-Item -Path "$baseDir\*" -Destination 'C:\VersusTrade_Acc2' -Recurse -Force
    Write-Host "   [OK] Folder C:\VersusTrade_Acc2 berjaya dicipta!" -ForegroundColor Green
}

# Klon Acc3 jika tiada
if (-not (Test-Path 'C:\VersusTrade_Acc3\terminal64.exe')) {
    Write-Host "   [INFO] Menyediakan Terminal 3 di C:\VersusTrade_Acc3..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path 'C:\VersusTrade_Acc3' | Out-Null
    Copy-Item -Path "$baseDir\*" -Destination 'C:\VersusTrade_Acc3' -Recurse -Force
    Write-Host "   [OK] Folder C:\VersusTrade_Acc3 berjaya dicipta!" -ForegroundColor Green
}

# Klon Acc4 jika tiada
if (-not (Test-Path 'C:\VersusTrade_Acc4\terminal64.exe')) {
    Write-Host "   [INFO] Menyediakan Terminal 4 di C:\VersusTrade_Acc4 (#5100227599)..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path 'C:\VersusTrade_Acc4' | Out-Null
    Copy-Item -Path "$baseDir\*" -Destination 'C:\VersusTrade_Acc4' -Recurse -Force
    Write-Host "   [OK] Folder C:\VersusTrade_Acc4 berjaya dicipta!" -ForegroundColor Green
}

# Folder Bridge
New-Item -ItemType Directory -Force -Path 'C:\AmaterasuX' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\AmaterasuX_Acc2' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\AmaterasuX_Acc3' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\AmaterasuX_Acc4' | Out-Null

Write-Host "4. Memuat turun fail bridge terkini (80p Gold buffer + .s support)..." -ForegroundColor Cyan
$cleanBridgeUrl = "https://amaterasux.com/amaterasu_mt5_bridge.py"
$tempPy = "$env:TEMP\amaterasu_mt5_bridge.py"
try {
    Invoke-RestMethod -Uri $cleanBridgeUrl -OutFile $tempPy -TimeoutSec 15
} catch {}

if (Test-Path $tempPy) {
    Copy-Item $tempPy 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item $tempPy 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item $tempPy 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Copy-Item $tempPy 'C:\AmaterasuX_Acc4\amaterasu_mt5_bridge.py' -Force
    Write-Host "   [OK] Fail bridge terkini disalin ke semua 4 akaun!" -ForegroundColor Green
}

Write-Host "5. Menulis fail konfigurasi bagi keempat-empat akaun TERBARU..." -ForegroundColor Cyan

# CONFIG MASTER 1
$t1Path = if (Test-Path 'C:\VersusTrade_Acc1\terminal64.exe') { "C:\\VersusTrade_Acc1\\terminal64.exe" } else { "C:\\Program Files\\Versus Trade MetaTrader 5 Terminal\\terminal64.exe" }
$cfg1 = @"
{
  "server_url": "https://amaterasux.com",
  "lot_size": 0.2,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50,
  "max_concurrent_pairs": 4,
  "max_slippage_pips": 10,
  "magic_number": 888999,
  "mt5_login": 5100221532,
  "mt5_password": "Tengku1990@",
  "mt5_server": "VersusTrade-Live1",
  "mt5_terminal_path": "$t1Path",
  "allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"],
  "custom_lot_map": {"XAUUSD": 0.2, "USDCHF": 0.2, "EURUSD": 0.2},
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.35,
  "dynamic_floating_atr": true,
  "max_account_lots": 5.0,
  "max_gold_positions": 8,
  "news_gold_lot_size": 0.4,
  "news_fx_lot_size": 0.4
}
"@
Set-Content -Path 'C:\AmaterasuX\bridge_config.json' -Value $cfg1 -Encoding UTF8

# CONFIG MASTER 2
$cfg2 = @'
{
  "server_url": "https://amaterasux.com",
  "lot_size": 0.2,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50,
  "max_concurrent_pairs": 4,
  "max_slippage_pips": 10,
  "magic_number": 888998,
  "mt5_login": 5100221533,
  "mt5_password": "o6019f!F",
  "mt5_server": "VersusTrade-Live1",
  "mt5_terminal_path": "C:\\VersusTrade_Acc2\\terminal64.exe",
  "allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"],
  "custom_lot_map": {"XAUUSD": 0.2, "USDCHF": 0.2, "EURUSD": 0.2},
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.35,
  "dynamic_floating_atr": true,
  "max_account_lots": 5.0,
  "max_gold_positions": 8,
  "news_gold_lot_size": 0.4,
  "news_fx_lot_size": 0.4
}
'@
Set-Content -Path 'C:\AmaterasuX_Acc2\bridge_config.json' -Value $cfg2 -Encoding UTF8

# CONFIG MASTER 3
$cfg3 = @'
{
  "server_url": "https://amaterasux.com",
  "lot_size": 0.02,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50,
  "max_concurrent_pairs": 4,
  "max_slippage_pips": 10,
  "magic_number": 888997,
  "mt5_login": 5100221534,
  "mt5_password": "Tengku1990@",
  "mt5_server": "VersusTrade-Live1",
  "mt5_terminal_path": "C:\\VersusTrade_Acc3\\terminal64.exe",
  "allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"],
  "custom_lot_map": {"XAUUSD": 0.02, "USDCHF": 0.03, "EURUSD": 0.03},
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.03,
  "dynamic_floating_atr": true,
  "max_account_lots": 5.0,
  "max_gold_positions": 8,
  "news_gold_lot_size": 0.04,
  "news_fx_lot_size": 0.05
}
'@
Set-Content -Path 'C:\AmaterasuX_Acc3\bridge_config.json' -Value $cfg3 -Encoding UTF8

# CONFIG MASTER 4 (#5100227599)
$cfg4 = @'
{
  "server_url": "https://amaterasux.com",
  "lot_size": 0.2,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "gold_min_be_pips": 50,
  "max_concurrent_pairs": 4,
  "max_slippage_pips": 10,
  "magic_number": 888994,
  "mt5_login": 5100227599,
  "mt5_password": "!b4354Q0",
  "mt5_server": "VersusTrade-Live1",
  "mt5_terminal_path": "C:\\VersusTrade_Acc4\\terminal64.exe",
  "allowed_pairs": ["XAUUSD", "USDCHF", "EURUSD"],
  "custom_lot_map": {"XAUUSD": 0.2, "USDCHF": 0.2, "EURUSD": 0.2},
  "ny_gold_multiplier_active": true,
  "ny_gold_lot_size": 0.35,
  "dynamic_floating_atr": true,
  "max_account_lots": 5.0,
  "max_gold_positions": 8,
  "news_gold_lot_size": 0.4,
  "news_fx_lot_size": 0.4
}
'@
Set-Content -Path 'C:\AmaterasuX_Acc4\bridge_config.json' -Value $cfg4 -Encoding UTF8
Write-Host "   [OK] Keempat-empat bridge_config.json telah berjaya dikemas kini!" -ForegroundColor Green

Write-Host "6. Mengemaskini pelancar START_ALL_BRIDGES di Desktop..." -ForegroundColor Cyan
$desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$allBat = @'
@echo off
title AMATERASU X - 4 TERMINAL MT5 & 4 BRIDGES
color 0B
echo ===============================================================================
echo            MEMBUKA KEEMPAT-EMPAT TERMINAL MT5 DAN AI BRIDGE
echo ===============================================================================
echo.
echo [1/4] Membuka MT5 Terminal 1 (#5100221532 - DRAGON)...
if exist "C:\VersusTrade_Acc1\terminal64.exe" (
    start "" "C:\VersusTrade_Acc1\terminal64.exe" /portable /login:5100221532 /server:VersusTrade-Live1
) else (
    start "" "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe" /login:5100221532 /server:VersusTrade-Live1
)
timeout /t 3 >nul

echo [2/4] Membuka MT5 Terminal 2 (#5100221533 - MANTIS)...
start "" "C:\VersusTrade_Acc2\terminal64.exe" /portable /login:5100221533 /server:VersusTrade-Live1
timeout /t 3 >nul

echo [3/4] Membuka MT5 Terminal 3 (#5100221534 - TIGER)...
start "" "C:\VersusTrade_Acc3\terminal64.exe" /portable /login:5100221534 /server:VersusTrade-Live1
timeout /t 3 >nul

echo [4/4] Membuka MT5 Terminal 4 (#5100227599 - MASTER 4)...
start "" "C:\VersusTrade_Acc4\terminal64.exe" /portable /login:5100227599 /server:VersusTrade-Live1
timeout /t 4 >nul

echo Menjalankan 4 Amaterasu Bridge...
start "Bridge Master 1 (#5100221532)" cmd /k "cd /d C:\AmaterasuX & python amaterasu_mt5_bridge.py"
timeout /t 2 >nul
start "Bridge Master 2 (#5100221533)" cmd /k "cd /d C:\AmaterasuX_Acc2 & python amaterasu_mt5_bridge.py"
timeout /t 2 >nul
start "Bridge Master 3 (#5100221534)" cmd /k "cd /d C:\AmaterasuX_Acc3 & python amaterasu_mt5_bridge.py"
timeout /t 2 >nul
start "Bridge Master 4 (#5100227599)" cmd /k "cd /d C:\AmaterasuX_Acc4 & python amaterasu_mt5_bridge.py"
exit
'@
Set-Content -Path (Join-Path $desktop "START_ALL_BRIDGES.bat") -Value $allBat -Encoding UTF8

# Buat shortcut ikon Terminal 4 di Desktop
try {
    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut((Join-Path $desktop "MT5 - Master 4 (#5100227599).lnk"))
    $sc.TargetPath = "C:\VersusTrade_Acc4\terminal64.exe"
    $sc.Arguments = "/portable"
    $sc.WorkingDirectory = "C:\VersusTrade_Acc4"
    $sc.IconLocation = "C:\VersusTrade_Acc4\terminal64.exe,0"
    $sc.Save()
} catch {}

Write-Host "7. Melancarkan 4 terminal MT5 dan 4 Bridge baharu sekarang..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList '/c', (Join-Path $desktop "START_ALL_BRIDGES.bat")

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "   SEMUA 4 TERMINAL MT5 DAN 4 BRIDGE KINI DIBUKA SERENTAK DI VPS!" -ForegroundColor Green
Write-Host "===============================================================================`n" -ForegroundColor Green
Start-Sleep -Seconds 3
