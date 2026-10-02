@echo off
setlocal
cd /d "%~dp0"
echo.
echo Leave this window OPEN while using the dashboard. Closing it stops the server.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Dashboard.ps1"
if errorlevel 1 (
  echo.
  echo Startup failed — see messages above. Common fixes: install Node.js LTS, or delete server\prisma\dev.db and run this again for a fresh database.
  echo.
)
pause
