@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js first.
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm not found. Run: npm install -g pnpm
  exit /b 1
)

if not exist "node_modules\concurrently" (
  echo Installing root dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo.
echo Starting backstage-management...
echo   API:   http://localhost:3001/car
echo   Admin: http://localhost:8848
echo.

call npm run dev
