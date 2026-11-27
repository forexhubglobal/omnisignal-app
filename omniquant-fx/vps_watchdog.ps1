# =====================================================================
# OMNIQUANT FX x AMATERASU X - MASTER 24/7 VPS WATCHDOG
# Auto-heals EVERY 15 SECONDS:
#   1. Cloudflare Tunnel (`cloudflared.exe`) -> Prevents Error 1033!
#   2. Amaterasu X Web Server (`:3000`)      -> amaterasux.com
#   3. OMNIQUANT FX Unified (`:3005 & :8005`)-> quant.amaterasux.com
# =====================================================================

$Host.UI.RawUI.WindowTitle = "OMNIQUANT-24-7-WATCHDOG"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $RootDir
$BackendDir = Join-Path $RootDir "backend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

$TunnelToken = "eyJhIjoiZDJkMTY3OWU2MGQwZmQzMzVlMTU5ZTQyYTBmMjZkMjAiLCJ0IjoiZTkxZmFiYzYtNzA0NC00ODJkLWJlYzktMDA3MjI1OWMyMzJiIiwicyI6Ik5tTTVPVEZtTkdRdE1XSXhOaTAwT0RjNExXSmpNR0l0T1dJMVptRmlOelEyWVdVNCJ9"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MASTER 24/7 VPS GUARDIAN (CLOUDFLARE + :3000 + :3005)   " -ForegroundColor Cyan
Write-Host "  Main Domain  : https://amaterasux.com (:3000)           " -ForegroundColor Green
Write-Host "  Quant Domain : https://quant.amaterasux.com (:3005)     " -ForegroundColor Green
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

function Get-CloudflaredExe {
    foreach ($cand in @(
        "C:\AmaterasuX\tools\cloudflared.exe",
        (Join-Path $RepoRoot "cloudflared.exe"),
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe"
    )) {
        if (Test-Path $cand) { return $cand }
    }
    return $null
}

while ($true) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

    # 1. Auto-Heal Cloudflare Tunnel (Fixes Error 1033 / 530!)
    $cfProc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if (-not $cfProc) {
        $cfExe = Get-CloudflaredExe
        if ($cfExe) {
            Write-Host "[$ts] [TUNNEL] Menghidupkan semula Cloudflare Tunnel (cloudflared.exe)..." -ForegroundColor Yellow
            Start-Process -FilePath $cfExe `
                -ArgumentList "tunnel run --token $TunnelToken" `
                -WindowStyle Minimized
            Start-Sleep -Seconds 3
        }
    }

    # 2. Auto-Heal Amaterasu Main Server (:3000) if installed in C:\AmaterasuX
    if ((-not (Test-LocalPort 3000)) -and (Test-Path "C:\AmaterasuX\server.js")) {
        $nodeBin = if (Test-Path "C:\AmaterasuX\node.exe") { "C:\AmaterasuX\node.exe" } else { "node" }
        Write-Host "[$ts] [AMATERASU] Menghidupkan semula server.js (:3000)..." -ForegroundColor Yellow
        Start-Process -FilePath $nodeBin `
            -ArgumentList "server.js" `
            -WorkingDirectory "C:\AmaterasuX" `
            -WindowStyle Minimized
        Start-Sleep -Seconds 2
    }

    # 3. Auto-Heal OMNIQUANT FX Unified Server (:3005 & :8005)
    if (-not (Test-LocalPort 3005)) {
        Write-Host "[$ts] [WATCHDOG] Menghidupkan Unified OMNIQUANT Server (:3005 & :8005)..." -ForegroundColor Yellow
        if (Test-Path $VenvPython) {
            Start-Process -FilePath $VenvPython `
                -ArgumentList "serve_vps.py" `
                -WorkingDirectory $BackendDir `
                -WindowStyle Minimized
            Start-Sleep -Seconds 4
        }
    }

    # 4. Auto-Heal MT5 Bridges (Master 1 & Master 5) if stopped
    $pyWin = $null
    foreach ($pc in @(
        "C:\Users\Administrator\AppData\Local\Programs\Python\Python311\pythonw.exe",
        "C:\Users\US\AppData\Local\Programs\Python\Python311\pythonw.exe",
        "C:\Program Files\Python311\pythonw.exe"
    )) {
        if (Test-Path $pc) { $pyWin = $pc; break }
    }
    if ($pyWin) {
        $allBridges = Get-WmiObject Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "amaterasu_mt5_bridge\.py" }
        foreach ($bDir in @("C:\AmaterasuX", "C:\AmaterasuX_Acc5")) {
            $bScript = Join-Path $bDir "amaterasu_mt5_bridge.py"
            if (Test-Path $bScript) {
                $isUp = $false
                foreach ($bp in $allBridges) {
                    $exeCmd = [string]$bp.CommandLine
                    if ($exeCmd -like "*$bDir*") { $isUp = $true; break }
                }
                if (-not $isUp) {
                    Start-Process -FilePath $pyWin -ArgumentList "`"$bScript`"" -WorkingDirectory $bDir -WindowStyle Hidden
                }
            }
        }
    }

    Start-Sleep -Seconds 15
}
