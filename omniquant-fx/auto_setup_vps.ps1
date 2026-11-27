# =====================================================================
# OMNIQUANT FX - ZERO-NODE PURE-PYTHON VPS INSTALLER (SERVER 2016/2019+)
# =====================================================================
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $RootDir
$BackendDir = Join-Path $RootDir "backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$WatchdogScript = Join-Path $RootDir "vps_watchdog.ps1"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  [OMNIQUANT FX] MENJALANKAN PURE-PYTHON VPS AUTO-SETUP (:3005 & :8005)...     " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# Ensure Git auto-hook is enabled on this VPS clone for all future git pulls
try {
    git -C $RepoRoot config core.hooksPath .githooks 2>$null
} catch {}

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

# 2. Setup Python Virtual Environment & Backend Dependencies (fast-skip if already installed)
if (-not (Test-Path $VenvPython)) {
    Write-Host "[1/3] Membina persekitaran Python (.venv) untuk OMNIQUANT FX..." -ForegroundColor Yellow
    & $SysPython -m venv (Join-Path $BackendDir ".venv")
}
if (-not (Test-Path (Join-Path $BackendDir ".venv\Lib\site-packages\fastapi"))) {
    Write-Host "[2/3] Memasang pakej Python (FastAPI, Uvicorn, NumPy, MetaTrader5)..." -ForegroundColor Yellow
    & $VenvPython -m pip install --quiet -r (Join-Path $BackendDir "requirements.txt")
} else {
    Write-Host "[2/3] Pakej Python sudah lengkap (fast start)." -ForegroundColor Green
}

# 3. Stop any previous OMNIQUANT Watchdog or listeners on 3005 / 8005 (compatible with Server 2016)
Get-WmiObject Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "vps_watchdog\.ps1" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$netstatLines = netstat -ano | Select-String -Pattern "127\.0\.0\.1:(3005|8005)\s+.*LISTENING|0\.0\.0\.0:(3005|8005)\s+.*LISTENING"
foreach ($line in $netstatLines) {
    $parts = ($line.ToString().Trim() -split "\s+")
    $pidVal = [int]$parts[-1]
    if ($pidVal -gt 4) {
        Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

# 4. Ensure cloudflared.exe binary exists in C:\AmaterasuX\tools so Tunnel never stays offline (Error 1033 fix)
$CfDir = "C:\AmaterasuX\tools"
$CfExe = Join-Path $CfDir "cloudflared.exe"
if ((-not (Test-Path $CfExe)) -and (-not (Test-Path (Join-Path $RepoRoot "cloudflared.exe")))) {
    Write-Host "[TUNNEL] Memuat turun cloudflared.exe rasmi ke $CfExe..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $CfDir | Out-Null
    try {
        (New-Object Net.WebClient).DownloadFile(
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe",
            $CfExe
        )
    } catch {}
}

# 5. Register 24/7 Boot Task in Windows Task Scheduler & Launch Watchdog
schtasks /Create /TN "OmniQuantFX_24_7" /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$WatchdogScript`"" /SC ONLOGON /RL HIGHEST /F >$null 2>&1

Write-Host "[3/3] Melancarkan OMNIQUANT FX Unified Server 24/7 (:3005 & :8005)..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Minimized -File `"$WatchdogScript`"" `
    -WorkingDirectory $RootDir `
    -WindowStyle Minimized

Start-Sleep -Seconds 5
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  [SIAP!] https://quant.amaterasux.com (Port 3005) KINI AKTIF 24/7 DI VPS!     " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
