(Get-Content 'C:\AmaterasuX\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc2\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc2\bridge_config.json'
(Get-Content 'C:\AmaterasuX_Acc3\bridge_config.json') -replace 'https://amaterasux.onrender.com', 'https://equal-shield-amber-wilderness.trycloudflare.com' | Set-Content 'C:\AmaterasuX_Acc3\bridge_config.json'
Write-Host "BERJAYA! Ketiga-tiga konfigurasi akaun telah dikemas kini ke Cloudflare." -ForegroundColor Green
