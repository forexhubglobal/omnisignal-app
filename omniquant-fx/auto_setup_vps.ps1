# =====================================================================
# OMNIQUANT FX - ZERO-TOUCH VPS AUTO-INSTALLER (TRIGGERED BY GIT PULL)
# =====================================================================
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$WatchdogScript = Join-Path $RootDir "vps_watchdog.ps1"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  [OMNIQUANT FX] MENJALANKAN AUTO-SETUP & DEPLOYMENT 24/7 DI VPS...            " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# 1. Locate Python 3 on VPS
$SysPython = $null
foreach ($cand in @(
    "python",
    "C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe",
    "C:\Users\US\AppData\Local\Programs\Python\Python311\python.exe",
    "C:\Program Files\Python311\python.exe"
)) {
    if ($cand -eq "python") {
        if (Get-Command "python" -ErrorAction SilentlyContinue) { $SysPython = "python"; break }
    } elseif (Test-Path $cand) {
        $SysPython = $cand; break
    }
}

if (-not $SysPython) {
    Write-Host "[RALAT] Python 3 tidak ditemui di VPS!" -ForegroundColor Red
    exit 1
}

# 2. Setup Python Virtual Environment & Backend Dependencies
if (-not (Test-Path $VenvPython)) {
    Write-Host "[1/5] Membina persekitaran Python (.venv) untuk OMNIQUANT FX..." -ForegroundColor Yellow
    & $SysPython -m venv (Join-Path $BackendDir ".venv")
}
Write-Host "[1/5] Mengesahkan pakej FastAPI, NumPy & MetaTrader5..." -ForegroundColor Green
& $VenvPython -m pip install --quiet --disable-pip-version-check -r (Join-Path $BackendDir "requirements.txt")

# 3. Ensure Node.js & npm.cmd are available on VPS (auto-install Node LTS silently if missing)
if (Test-Path "C:\Program Files\nodejs") {
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
}
if (-not (Get-Command "npm.cmd" -ErrorAction SilentlyContinue)) {
    Write-Host "[2/5] Memasang Node.js LTS secara automatik di VPS..." -ForegroundColor Yellow
    $nodeMsi = Join-Path $env:TEMP "node-lts-x64.msi"
    (New-Object Net.WebClient).DownloadFile("https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi", $nodeMsi)
    Start-Process "msiexec.exe" -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
}

$NpmCmd = if (Test-Path "C:\Program Files\nodejs\npm.cmd") { "C:\Program Files\nodejs\npm.cmd" } else { "npm.cmd" }

# 4. Smart Hash Check for Next.js Install & Production Build
$HashFile = Join-Path $FrontendDir ".build_hash"
$SrcFiles = Get-ChildItem -Path (Join-Path $FrontendDir "src"), (Join-Path $FrontendDir "package.json") -Recurse -File
$ConcatHashes = ($SrcFiles | ForEach-Object { (Get-FileHash $_.FullName -Algorithm SHA256).Hash }) -join ""
$CurrentHash = [System.BitConverter]::ToString(
    [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($ConcatHashes))
).Replace("-", "")

$OldHash = if (Test-Path $HashFile) { (Get-Content $HashFile -Raw).Trim() } else { "" }

if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "[2/5] Memasang pakej Next.js (npm install)..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & $NpmCmd install --no-audit --no-fund
    Pop-Location
}

if ((-not (Test-Path (Join-Path $FrontendDir ".next\BUILD_ID"))) -or ($CurrentHash -ne $OldHash)) {
    Write-Host "[3/5] Membina produksi Next.js terkini (npm run build)..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & $NpmCmd run build
    Pop-Location
    Set-Content -Path $HashFile -Value $CurrentHash -Encoding UTF8
} else {
    Write-Host "[3/5] Binaan produksi Next.js sudah terkini (skip build)." -ForegroundColor Green
}

# 5. Stop Old Watchdog / Port 8005 & 3005 Listeners Cleanly Before Restarting
Write-Host "[4/5] Mengemas kini servis latar belakang (Port 8005 & 3005)..." -ForegroundColor Cyan
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "vps_watchdog\.ps1" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

foreach ($port in @(8005, 3005)) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        Where-Object { $_ -gt 4 } |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

# 6. Register 24/7 Boot Task in Windows Task Scheduler & Launch Watchdog
schtasks /Create /TN "OmniQuantFX_24_7" /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$WatchdogScript`"" /SC ONLOGON /RL HIGHEST /F >$null 2>&1

Write-Host "[5/5] Melancarkan Watchdog 24/7 OMNIQUANT FX (:8005 & :3005)..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Minimized -File `"$WatchdogScript`"" `
    -WorkingDirectory $RootDir `
    -WindowStyle Minimized

Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  [SIAP!] OMNIQUANT FX AKTIF 24/7 DI http://127.0.0.1:3005 (& GATEKEEPER :8005) " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
