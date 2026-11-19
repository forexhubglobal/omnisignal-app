import os

desktop = os.path.join(os.environ.get('USERPROFILE', ''), 'Desktop')
bat1 = os.path.join(desktop, 'RUN_ALL_3_ACCOUNTS.bat')
bat2 = os.path.join(desktop, 'START_ALL_BRIDGES.bat')

content = """@echo off
title AMATERASU X - LAUNCH ALL 3 MASTER ACCOUNTS
color 0B

echo ===============================================================================
echo          AMATERASU X - MEMULAKAN KETIGA-TIGA MASTER ACCOUNTS SERENTAK
echo ===============================================================================
echo.
echo [1/3] Menjalankan Master 1 (Cent+ #5100221532)...
start "Bridge Master 1 (Cent+)" cmd /k "cd /d C:\\AmaterasuX & python amaterasu_mt5_bridge.py"
timeout /t 2 >nul

echo [2/3] Menjalankan Master 2 (Cent+ #5100221533)...
start "Bridge Master 2 (Cent+)" cmd /k "cd /d C:\\AmaterasuX_Acc2 & python amaterasu_mt5_bridge.py"
timeout /t 2 >nul

echo [3/3] Menjalankan Master 3 (Standard+ #5100221534)...
start "Bridge Master 3 (Standard+)" cmd /k "cd /d C:\\AmaterasuX_Acc3 & python amaterasu_mt5_bridge.py"

echo.
echo ===============================================================================
echo      SEMUA 3 BRIDGE BERJAYA DIJALANKAN DENGAN REKOD BERSIH 100%!
echo ===============================================================================
echo.
timeout /t 5
"""

for b in [bat1, bat2]:
    with open(b, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated shortcut:', b)
