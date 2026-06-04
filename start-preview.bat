@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "http://127.0.0.1:3003"
npm run dev
pause
