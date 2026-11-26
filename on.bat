@echo off
title OMNIQUANT FX - 1-CLICK VPS ACTIVATE
color 0A
git -C "%~dp0" config core.hooksPath .githooks >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0omniquant-fx\auto_setup_vps.ps1"
