# =====================================================================
# OMNIQUANT FX - 24/7 VPS SELF-HEALING WATCHDOG (WINDOWS VPS)
# Auto-monitors FastAPI (:8005) & Next.js (:3005) every 15 seconds.
# =====================================================================

$Host.UI.RawUI.WindowTitle = "OMNIQUANT-24-7-WATCHDOG"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

$NpmCmd = "npm.cmd"
if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
    $env:Path = "C:\Program Files\nodejs;" + $env:Path
    $NpmCmd = "C:\Program Files\nodejs\npm.cmd"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  OMNIQUANT FX x AMATERASU X - 24/7 VPS WATCHDOG ACTIVE   " -ForegroundColor Cyan
Write-Host "  FastAPI Engine : http://127.0.0.1:8005                  " -ForegroundColor Green
Write-Host "  Next.js Web UI : http://127.0.0.1:3005 (Cloudflare Ready)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

function Test-LocalPort($Port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect("127.0.0.1", $Port, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(1200, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.Close()
            return $true
        }
        $tcp.Close()
        return $false
    } catch {
        return $false
    }
}

while ($true) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

    # 1. Ensure FastAPI Quant Engine (:8005) is running
    if (-not (Test-LocalPort 8005)) {
        Write-Host "[$ts] [WATCHDOG] Menghidupkan FastAPI Quant Engine (:8005)..." -ForegroundColor Yellow
        if (Test-Path $VenvPython) {
            Start-Process -FilePath $VenvPython `
                -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8005" `
                -WorkingDirectory $BackendDir `
                -WindowStyle Minimized
            Start-Sleep -Seconds 5
            try {
                Invoke-RestMethod -Uri "http://127.0.0.1:8005/api/v1/mt5/connect" -Method Post -TimeoutSec 10 | Out-Null
                Write-Host "[$ts] [MT5-IPC] Auto-connected FastAPI ke terminal MT5 VPS!" -ForegroundColor Green
            } catch {}
        }
    }

    # 2. Ensure Next.js Production Server (:3005) is running
    if (-not (Test-LocalPort 3005)) {
        Write-Host "[$ts] [WATCHDOG] Menghidupkan Next.js Production UI (:3005)..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c `"$NpmCmd`" run start" `
            -WorkingDirectory $FrontendDir `
            -WindowStyle Minimized
        Start-Sleep -Seconds 4
    }

    Start-Sleep -Seconds 15
}
