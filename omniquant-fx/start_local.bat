@echo off
title OMNIQUANT FX - Local Fullstack Launcher
echo ========================================================
echo   OMNIQUANT FX - Autonomous Forex Intelligence Stack
echo   Backend FastAPI : http://127.0.0.1:8005
echo   Frontend Next.js: http://localhost:3005
echo ========================================================

start "OMNIQUANT-Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8005"
timeout /t 2 /nobreak >nul
start "OMNIQUANT-Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo Servers starting! Open http://localhost:3005 in your browser.
