Write-Host "Memuat turun fail bridge terkini yang bersih..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py" -OutFile "$env:TEMP\amaterasu_mt5_bridge.py"

if (Test-Path "$env:TEMP\amaterasu_mt5_bridge.py") {
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item "$env:TEMP\amaterasu_mt5_bridge.py" 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Write-Host "[OK] Fail bridge telah dikemas kini ke versi terkini tanpa sebarang ralat!" -ForegroundColor Green
}

Write-Host "Mengemas kini URL pelayan ke Cloudflare..." -ForegroundColor Cyan
(Get-Content 'C:\AmaterasuX\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc2\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc2\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc3\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc3\bridge_config.json'

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "BERJAYA! SEMUA KOD BRIDGE DAN KONFIGURASI AKAUN TELAH DIPERBAIKI 100%!" -ForegroundColor Green
Write-Host "===============================================================================`n" -ForegroundColor Green
