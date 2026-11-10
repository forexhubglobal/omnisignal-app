Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         AMATERASU X - MULTI-ACCOUNT BRIDGE REPAIR & AUTO-LAUNCH" -ForegroundColor Cyan
Write-Host "===============================================================================`n" -ForegroundColor Cyan

Write-Host "1. Menutup sebarang tetingkap bridge lama yang tergantung/crashed..." -ForegroundColor Yellow
Get-Process -Name cmd, python -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Amaterasu*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "2. Memuat turun versi bridge terkini dari pelayan Cloudflare..." -ForegroundColor Cyan
$cleanBridgeUrl = "https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py"
Invoke-RestMethod -Uri $cleanBridgeUrl -OutFile "$env:TEMP\amaterasu_mt5_bridge.py"

if (Test-Path "$env:TEMP\amaterasu_mt5_bridge.py") {
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Write-Host "   [OK] Fail bridge terkini telah diselaraskan ke Acc1, Acc2, dan Acc3!" -ForegroundColor Green
}

Write-Host "3. Memastikan konfigurasi pelayan menuju ke Cloudflare..." -ForegroundColor Cyan
$cfUrl = "https://equal-shield-amber-wilderness.trycloudflare.com"

foreach ($dir in @('C:\AmaterasuX', 'C:\AmaterasuX_Acc2', 'C:\AmaterasuX_Acc3')) {
    $cfgFile = Join-Path $dir "bridge_config.json"
    if (Test-Path $cfgFile) {
        $json = Get-Content $cfgFile -Raw | ConvertFrom-Json
        $json.server_url = $cfUrl
        $json | ConvertTo-Json -Depth 5 | Set-Content $cfgFile -Encoding UTF8
    }
}
Write-Host "   [OK] Semua bridge_config.json telah dipautkan ke pelayan live!" -ForegroundColor Green

Write-Host "4. Mencipta shortcut START_ALL_BRIDGES pada Desktop VPS..." -ForegroundColor Cyan
$desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
if (Test-Path $desktop) {
    $batContent = "@echo off`ntitle START ALL AMATERASU BRIDGES`necho Memulakan semua bridge Amaterasu X...`nstart cmd /k `"cd /d C:\AmaterasuX && python amaterasu_mt5_bridge.py`"`nstart cmd /k `"cd /d C:\AmaterasuX_Acc2 && python amaterasu_mt5_bridge.py`"`nstart cmd /k `"cd /d C:\AmaterasuX_Acc3 && python amaterasu_mt5_bridge.py`"`nexit"
    Set-Content -Path (Join-Path $desktop "START_ALL_BRIDGES.bat") -Value $batContent
    Write-Host "   [OK] Shortcut START_ALL_BRIDGES.bat telah tersedia di Desktop!" -ForegroundColor Green
}

Write-Host "5. Melancarkan terus 3 tetingkap bridge sekarang..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList '/k title Amaterasu Bridge - Akaun 1 (#5100154135) & python amaterasu_mt5_bridge.py' -WorkingDirectory 'C:\AmaterasuX'
Start-Process cmd.exe -ArgumentList '/k title Amaterasu Bridge - Akaun 2 (#5100207348) & python amaterasu_mt5_bridge.py' -WorkingDirectory 'C:\AmaterasuX_Acc2'
Start-Process cmd.exe -ArgumentList '/k title Amaterasu Bridge - Akaun 3 (#5100209626) & python amaterasu_mt5_bridge.py' -WorkingDirectory 'C:\AmaterasuX_Acc3'

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "   BERJAYA! KETIGA-TIGA TETINGKAP HITAM BRIDGE KINI DIBUKA SERENTAK DI TASKBAR!" -ForegroundColor Green
Write-Host "===============================================================================`n" -ForegroundColor Green
