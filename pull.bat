@echo off
title AMATERASU X - 1-COMMAND GIT PULL & FULL VPS AUTO-SYNC
color 0A
echo ===============================================================================
echo          AMATERASU X - 1-COMMAND GIT PULL ^& FULL VPS AUTO-SYNC
echo ===============================================================================
echo.
echo [1/2] Menarik kod teknikal terkini dari GitHub...
git pull origin main
echo.
echo [2/2] Melaksanakan penyelarasan penuh dan auto-restart 5 Akaun...
call "%~dp0update.bat"
