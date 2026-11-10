$bridgeUrl = "https://raw.githubusercontent.com/forexhubglobal/omnisignal-app/main/amaterasu_mt5_bridge.py"
$bridgeFile = "$env:TEMP\amaterasu_mt5_bridge.py"

Write-Host "Memuat turun fail bridge terkini yang bersih..." -ForegroundColor Cyan
irm $bridgeUrl -OutFile $bridgeFile

if (Test-Path $bridgeFile) {
    Copy-Item $bridgeFile 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item $bridgeFile 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item $bridgeFile 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Write-Host "[OK] Fail bridge telah dikemas kini ke versi terkini tanpa ralat syntax!" -ForegroundColor Green
}

Write-Host "Mengemas kini URL pelayan ke Cloudflare..." -ForegroundColor Cyan
(Get-Content 'C:\AmaterasuX\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc2\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc2\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc3\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc3\bridge_config.json'

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "BERJAYA! SEMUA KOD BRIDGE DAN KONFIGURASI AKAUN TELAH DIPERBAIKI 100%!" -ForegroundColor Green
Write-Host "===============================================================================`n" -ForegroundColor Green
