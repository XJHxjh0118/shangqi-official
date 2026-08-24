@echo off
chcp 65001 >nul 2>nul
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "%~dp0.."
set "ROOT=%cd%"
set "MGMT=%ROOT%\backstage-management"
set "FRONT=%ROOT%\official-website"
set "API=%MGMT%\server"

echo ========================================
echo   Official Demo - One Click Start
echo ========================================
echo.

if not exist "%MGMT%" goto fail_missing_mgmt
if not exist "%FRONT%" goto fail_missing_front

where node >nul 2>nul
if errorlevel 1 goto fail_no_node

where npm >nul 2>nul
if errorlevel 1 goto fail_no_npm

call :ensure_pnpm
if errorlevel 1 goto fail_no_pnpm

call :release_dev_locks

echo [1/5] Check env files...
if not exist "%API%\.env" if exist "%API%\.env.example" copy /Y "%API%\.env.example" "%API%\.env" >nul
if not exist "%FRONT%\.env" if exist "%FRONT%\.env.example" copy /Y "%FRONT%\.env.example" "%FRONT%\.env" >nul

echo [2/5] Check backend dependencies...
if not exist "%MGMT%\node_modules\concurrently" (
  echo       Installing backstage-management root deps...
  pushd "%MGMT%"
  call npm install
  if errorlevel 1 goto fail_popd
  popd
)
if not exist "%API%\node_modules" (
  echo       Installing API deps...
  pushd "%API%"
  call npm install
  if errorlevel 1 goto fail_popd
  popd
)
if not exist "%MGMT%\admin\node_modules" (
  echo       Installing admin deps with pnpm...
  pushd "%MGMT%\admin"
  call pnpm install
  if errorlevel 1 goto fail_popd
  popd
)

echo [3/5] Check database...
pushd "%API%"
if not exist "node_modules\.prisma\client\query_engine-windows.dll.node" (
  echo       Generating Prisma client...
  call :prisma_generate_with_retry
  if errorlevel 1 goto fail_popd
) else (
  echo       Prisma client OK, skip generate.
)
if not exist "dev.db" if not exist "prisma\dev.db" (
  echo       Initializing local database...
  call npm exec prisma db push --accept-data-loss
  if errorlevel 1 goto fail_popd
  call npm run prisma:seed
)
popd

echo [4/5] Check frontend dependencies...
if not exist "%FRONT%\node_modules\nuxt" (
  echo       Installing official-website deps...
  pushd "%FRONT%"
  call npm install
  if errorlevel 1 goto fail_popd
  popd
)

echo [5/5] Start services...
echo.
echo Starting backend API + admin...
echo   API:   http://127.0.0.1:3001/car
echo   Admin: http://localhost:8848
start "Official Demo Backend" /D "%MGMT%" cmd /k "chcp 65001 >nul & npm run dev"

call :wait_port 3001 90
if errorlevel 1 (
  echo [WARN] API port 3001 not ready yet. Check the Backend window.
)

echo Starting official website...
echo   Web: http://localhost:3000
start "Official Demo Website" /D "%FRONT%" cmd /k "chcp 65001 >nul & npm run dev"

call :wait_port 3000 120
if errorlevel 1 (
  echo [WARN] Website port 3000 not ready yet. First compile may take 1-2 min.
  echo        Wait for Nuxt to show Local: http://localhost:3000 then refresh browser.
) else (
  echo       Website is ready.
)

start "" "http://localhost:3000"
call :sleep 2
start "" "http://localhost:8848"

echo.
echo ========================================
echo   Start Complete
echo ========================================
echo   Website:   http://localhost:3000
echo   Admin:     http://localhost:8848
echo   API Docs:  http://127.0.0.1:3001/car/docs
echo   Login:     admin / admin123
echo.
echo   Keep the two black terminal windows open.
echo   First Nuxt start can be slow; wait until ready.
echo ========================================
echo.
pause
exit /b 0

:wait_port
set "WP=%~1"
set "WM=%~2"
if "%WM%"=="" set "WM=60"
echo       Waiting for port %WP% (max %WM%s)...
powershell -NoProfile -Command "param($p,$sec) for($i=0;$i -lt $sec;$i++){ if(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue){ Write-Host ('       Port ' + $p + ' ready after ~' + ($i*2) + 's'); exit 0 }; if($i %% 5 -eq 0){ Write-Host ('       still waiting... ' + ($i*2) + 's') }; Start-Sleep 2 }; exit 1" %WP% %WM%
exit /b %ERRORLEVEL%

:ensure_pnpm
where pnpm >nul 2>nul
if not errorlevel 1 exit /b 0
echo [INFO] pnpm not found, enabling via corepack...
call corepack enable >nul 2>nul
call corepack prepare pnpm@latest --activate
where pnpm >nul 2>nul
if errorlevel 1 exit /b 1
exit /b 0

:release_dev_locks
taskkill /FI "WINDOWTITLE eq Official Demo Backend*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Official Demo Website*" /F >nul 2>nul
call :killport 3000
call :killport 3001
call :killport 8848
call :sleep 2
exit /b 0

:prisma_generate_with_retry
call npm run prisma:generate
if not errorlevel 1 exit /b 0
echo [WARN] Prisma generate failed, retrying...
call :release_dev_locks
if exist "node_modules\.prisma\client" rmdir /s /q "node_modules\.prisma\client" >nul 2>nul
call :sleep 2
call npm run prisma:generate
exit /b %ERRORLEVEL%

:killport
set "PORT=%~1"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>nul
exit /b 0

:sleep
powershell -NoProfile -Command "Start-Sleep -Seconds %~1" >nul 2>nul
exit /b 0

:fail_popd
popd
goto fail

:fail_missing_mgmt
echo [ERROR] Folder not found: backstage-management
goto fail

:fail_missing_front
echo [ERROR] Folder not found: official-website
goto fail

:fail_no_node
echo [ERROR] Node.js not found. Install from https://nodejs.org
goto fail

:fail_no_npm
echo [ERROR] npm not found.
goto fail

:fail_no_pnpm
echo [ERROR] pnpm not available. Run: corepack enable
goto fail

:fail
echo.
echo Start failed. See messages above.
echo Tip: run start\一键停止.bat first, then try again.
echo.
pause
exit /b 1