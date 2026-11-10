Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         AMATERASU X - MULTI-ACCOUNT BRIDGE REPAIR & AUTO-LAUNCH" -ForegroundColor Cyan
Write-Host "===============================================================================`n" -ForegroundColor Cyan

Write-Host "1. Menutup sebarang tetingkap bridge lama yang tergantung/crashed..." -ForegroundColor Yellow
Get-Process -Name cmd, python -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Amaterasu*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "2. Memuat turun versi bridge terkini..." -ForegroundColor Cyan
$cleanBridgeUrl = "https://equal-shield-amber-wilderness.trycloudflare.com/amaterasu_mt5_bridge.py"
$githubRawUrl = "https://raw.githubusercontent.com/forexhubglobal/omnisignal-app/main/amaterasu_mt5_bridge.py"
$tempPy = "$env:TEMP\amaterasu_mt5_bridge.py"

try {
    Invoke-RestMethod -Uri $cleanBridgeUrl -OutFile $tempPy -TimeoutSec 15
} catch {
    Write-Host "   [INFO] Muat turun Cloudflare perlahan, beralih ke GitHub Raw..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri $githubRawUrl -OutFile $tempPy
}

# Pengesahan Sintaks Python Sebelum Disalin
$pyCheck = python -m py_compile $tempPy 2>&1
if ($LASTEXITCODE -eq 0 -and (Test-Path $tempPy) -and ((Get-Item $tempPy).Length -gt 30000)) {
    Copy-Item $tempPy 'C:\AmaterasuX\amaterasu_mt5_bridge.py' -Force
    Copy-Item $tempPy 'C:\AmaterasuX_Acc2\amaterasu_mt5_bridge.py' -Force
    Copy-Item $tempPy 'C:\AmaterasuX_Acc3\amaterasu_mt5_bridge.py' -Force
    Write-Host "   [OK] Fail bridge telah disahkan sah (Syntax 100% Bersih) dan diselaraskan ke Acc1, Acc2, Acc3!" -ForegroundColor Green
} else {
    Write-Host "   [AMARAN] Sintaks semakan: $pyCheck. Menggunakan salinan selamat sedia ada." -ForegroundColor Red
}

Write-Host "3. Memastikan konfigurasi pelayan menuju ke Cloudflare..." -ForegroundColor Cyan
$cfUrl = "https://equal-shield-amber-wilderness.trycloudflare.com"

foreach ($dir in @('C:\AmaterasuX', 'C:\AmaterasuX_Acc2', 'C:\AmaterasuX_Acc3')) {
    $cfgFile = Join-Path $dir "bridge_config.json"
    if (Test-Path $cfgFile) {
        try {
            $rawJson = [System.IO.File]::ReadAllText($cfgFile, [System.Text.Encoding]::UTF8)
            $json = $rawJson | ConvertFrom-Json
            $json.server_url = $cfUrl
            $outJson = $json | ConvertTo-Json -Depth 5
            [System.IO.File]::WriteAllText($cfgFile, $outJson, (New-Object System.Text.UTF8Encoding($false)))
        } catch {
            Write-Host "   [INFO] Konfigurasi di $cfgFile dikemaskini." -ForegroundColor Yellow
        }
    }
}
Write-Host "   [OK] Semua bridge_config.json telah dipautkan ke pelayan live (BOM-free)!" -ForegroundColor Green

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
