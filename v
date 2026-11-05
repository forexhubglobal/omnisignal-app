[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "   AMATERASU X - 1-CLICK AUTOMATED VPS INSTALLER" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

$workDir = "C:\AmaterasuX"
if (-not (Test-Path $workDir)) {
    New-Item -ItemType Directory -Path $workDir -Force | Out-Null
}
Set-Location $workDir

# 1. Check Python
Write-Host "[1/4] Menyemak status Python 3..." -ForegroundColor Cyan
$pyCmd = $null
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $pyCmd = "python"
} elseif (Test-Path "C:\Program Files\Python311\python.exe") {
    $pyCmd = "C:\Program Files\Python311\python.exe"
}

if (-not $pyCmd) {
    Write-Host "[INFO] Memuat turun Python 3.11 secara automatik..." -ForegroundColor Yellow
    $pyInstaller = "$env:TEMP\python_installer.exe"
    (New-Object Net.WebClient).DownloadFile("https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe", $pyInstaller)
    Write-Host "[INFO] Memasang Python secara senyap..." -ForegroundColor Yellow
    Start-Process $pyInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_pip=1" -Wait
    $pyCmd = "C:\Program Files\Python311\python.exe"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "[OK] Python sedia digunakan: $pyCmd" -ForegroundColor Green

# 2. Install Required Python Packages
Write-Host "[2/4] Memasang modul MetaTrader5 dan requests..." -ForegroundColor Cyan
& $pyCmd -m pip install --upgrade pip --quiet
& $pyCmd -m pip install MetaTrader5 requests --quiet
Write-Host "[OK] Modul MT5 sedia ada!" -ForegroundColor Green

# 3. Check MT5 Terminal
Write-Host "[3/4] Menyemak terminal MetaTrader 5..." -ForegroundColor Cyan
$mt5Path = "C:\Program Files\Versus Trade MetaTrader 5 Terminal\terminal64.exe"
if (-not (Test-Path $mt5Path)) {
    $altMt5 = "C:\Program Files\MetaTrader 5\terminal64.exe"
    if (Test-Path $altMt5) {
        $mt5Path = $altMt5
    } else {
        Write-Host "[INFO] Memuat turun MetaTrader 5 setup..." -ForegroundColor Yellow
        $mt5Installer = "$env:TEMP\mt5setup.exe"
        (New-Object Net.WebClient).DownloadFile("https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe", $mt5Installer)
        Write-Host "[INFO] Memasang MetaTrader 5 secara senyap..." -ForegroundColor Yellow
        Start-Process $mt5Installer -ArgumentList "/auto" -Wait
        if (Test-Path "C:\Program Files\MetaTrader 5\terminal64.exe") {
            $mt5Path = "C:\Program Files\MetaTrader 5\terminal64.exe"
        }
    }
}
Write-Host "[OK] Terminal MT5 sedia: $mt5Path" -ForegroundColor Green

# 4. Download latest Bridge files from Render
Write-Host "[4/4] Memuat turun Amaterasu X Bridge..." -ForegroundColor Cyan
$wc = New-Object Net.WebClient
$wc.DownloadFile("https://amaterasux.onrender.com/amaterasu_mt5_bridge.py", "$workDir\amaterasu_mt5_bridge.py")
$wc.DownloadFile("https://amaterasux.onrender.com/bridge_config.json", "$workDir\bridge_config.json")
Write-Host "[OK] Fail Bridge siap dimuat turun ke $workDir" -ForegroundColor Green

# Launch MT5 if not running
$runningMt5 = Get-Process -Name "terminal64" -ErrorAction SilentlyContinue
if (-not $runningMt5) {
    if (Test-Path $mt5Path) {
        Write-Host "[INFO] Memulakan MetaTrader 5..." -ForegroundColor Yellow
        Start-Process $mt5Path
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "   PEMASANGAN SELESAI! MEMULAKAN AMATERASU BRIDGE" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

& $pyCmd -u "$workDir\amaterasu_mt5_bridge.py"
