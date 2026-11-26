# =====================================================================
# OMNIQUANT FX - 24/7 PURE-PYTHON VPS WATCHDOG (WINDOWS SERVER 2016+)
# Serves BOTH 3D Web UI (:3005 for quant.amaterasux.com) & Gatekeeper (:8005)
# =====================================================================

$Host.UI.RawUI.WindowTitle = "OMNIQUANT-24-7-WATCHDOG"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  OMNIQUANT FX x AMATERASU X - 24/7 VPS WATCHDOG ACTIVE   " -ForegroundColor Cyan
Write-Host "  Cloudflare Web UI (:3005) : https://quant.amaterasux.com" -ForegroundColor Green
Write-Host "  Bot Gatekeeper    (:8005) : http://127.0.0.1:8005       " -ForegroundColor Green
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

    if (-not (Test-LocalPort 3005)) {
        Write-Host "[$ts] [WATCHDOG] Menghidupkan Unified OMNIQUANT Server (:3005 & :8005)..." -ForegroundColor Yellow
        if (Test-Path $VenvPython) {
            Start-Process -FilePath $VenvPython `
                -ArgumentList "serve_vps.py" `
                -WorkingDirectory $BackendDir `
                -WindowStyle Minimized
            Start-Sleep -Seconds 6
            try {
                Invoke-RestMethod -Uri "http://127.0.0.1:3005/api/v1/mt5/connect" -Method Post -TimeoutSec 10 | Out-Null
                Write-Host "[$ts] [ONLINE] quant.amaterasux.com (:3005) & MT5 Live tersambung!" -ForegroundColor Green
            } catch {}
        }
    }

    Start-Sleep -Seconds 15
}
