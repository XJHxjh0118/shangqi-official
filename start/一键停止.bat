@echo off
chcp 65001 >nul 2>nul
setlocal EnableExtensions
echo ========================================
echo   Official Demo - Stop All
echo ========================================
echo.
taskkill /FI "WINDOWTITLE eq Official Demo Backend*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Official Demo Website*" /F >nul 2>nul
call :killport 3000
call :killport 3001
call :killport 8848
echo Done. Close any remaining black terminal windows.
echo.
pause
exit /b 0

:killport
set "PORT=%~1"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  echo Killing PID %%a on port %PORT%
  taskkill /PID %%a /F >nul 2>nul
)
exit /b 0