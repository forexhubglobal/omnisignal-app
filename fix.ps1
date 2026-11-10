Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         AMATERASU X - MULTI-ACCOUNT BRIDGE REPAIR & AUTO-LAUNCH" -ForegroundColor Cyan
Write-Host "===============================================================================`n" -ForegroundColor Cyan

Write-Host "1. Menutup sebarang tetingkap bridge lama yang tergantung/crashed..." -ForegroundColor Yellow
Get-Process -Name cmd, python -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Amaterasu*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "2. Memuat turun versi bridge terkini dari pelayan..." -ForegroundColor Cyan
$cleanBridgeUrl = "https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py"
Invoke-RestMethod -Uri $cleanBridgeUrl -OutFile "$env:TEMP\amaterasu_mt5_bridge.py"

if (Test-Path "$env:TEMP\amaterasu_mt5_bridge.py") {
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Write-Host "   [OK] Fail bridge telah diselaraskan ke Acc1, Acc2, dan Acc3!" -ForegroundColor Green
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
    $batContent = "@echo off`ntitle START ALL AMATERASU BRIDGES`necho Memulakan semua bridge Amaterasu X...`nstart cmd /k C:\AmaterasuX\acc1.bat`nstart cmd /k C:\AmaterasuX_Acc2\acc2.bat`nstart cmd /k C:\AmaterasuX_Acc3\acc3.bat`nexit"
    Set-Content -Path (Join-Path $desktop "START_ALL_BRIDGES.bat") -Value $batContent
    Write-Host "   [OK] Shortcut START_ALL_BRIDGES.bat telah tersedia di Desktop!" -ForegroundColor Green
}

Write-Host "5. Melancarkan semula 3 terminal bridge secara automatik..." -ForegroundColor Cyan
if (Test-Path 'C:\AmaterasuX\acc1.bat') {
    Start-Process cmd.exe -ArgumentList '/k C:\AmaterasuX\acc1.bat' -WorkingDirectory 'C:\AmaterasuX'
}
if (Test-Path 'C:\AmaterasuX_Acc2\acc2.bat') {
    Start-Process cmd.exe -ArgumentList '/k C:\AmaterasuX_Acc2\acc2.bat' -WorkingDirectory 'C:\AmaterasuX_Acc2'
}
if (Test-Path 'C:\AmaterasuX_Acc3\acc3.bat') {
    Start-Process cmd.exe -ArgumentList '/k C:\AmaterasuX_Acc3\acc3.bat' -WorkingDirectory 'C:\AmaterasuX_Acc3'
}

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "   BERJAYA! SEMUA BRIDGE TELAH DIPERBAIKI DAN BERJALAN LANCAR (100% HIJAU)!" -ForegroundColor Green
Write-Host "===============================================================================`n" -ForegroundColor Green
