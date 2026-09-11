@echo off
REM =========================================
REM Network Deployment Script
REM Deploy to production server via network share
REM =========================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║   NETWORK DEPLOYMENT - HRMS Backend            ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Set network path - adjust IP or use UNC path
set SERVER_IP=192.168.1.14
set NETWORK_PATH=\\%SERVER_IP%\c$\xampp\htdocs\HRMS\backend

echo Target Server: %SERVER_IP%
echo Network Path: %NETWORK_PATH%
echo.

echo [1/5] Testing network connectivity...
ping -n 1 %SERVER_IP% >nul
if errorlevel 1 (
    echo ❌ Cannot reach server %SERVER_IP%
    echo    Please check:
    echo    - Server is powered on
    echo    - Network connection is active
    echo    - Firewall allows ping
    pause
    exit /b 1
)
echo ✅ Server is reachable
echo.

echo [2/5] Checking network path access...
if not exist "%NETWORK_PATH%" (
    echo ❌ Cannot access network path: %NETWORK_PATH%
    echo.
    echo    Possible issues:
    echo    - Admin share (c$) might be disabled
    echo    - You may not have network permissions
    echo    - Path might be incorrect
    echo.
    echo    Alternative: Manually copy files using Remote Desktop or shared folder
    pause
    exit /b 1
)
echo ✅ Network path is accessible
echo.

echo [3/5] Building application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully
echo.

echo [4/5] Copying dist folder to production...
echo    Creating backup of old dist...
if exist "%NETWORK_PATH%\dist_backup" rmdir /s /q "%NETWORK_PATH%\dist_backup"
if exist "%NETWORK_PATH%\dist" (
    move "%NETWORK_PATH%\dist" "%NETWORK_PATH%\dist_backup"
)

echo    Copying new dist folder...
xcopy /E /I /Y "dist" "%NETWORK_PATH%\dist"
if errorlevel 1 (
    echo ❌ Failed to copy dist folder!
    echo    Restoring backup...
    if exist "%NETWORK_PATH%\dist_backup" (
        move "%NETWORK_PATH%\dist_backup" "%NETWORK_PATH%\dist"
    )
    pause
    exit /b 1
)
echo ✅ Dist folder copied successfully
echo.

echo [5/5] Ensuring upload directories exist...
if not exist "%NETWORK_PATH%\uploads\documents" mkdir "%NETWORK_PATH%\uploads\documents"
if not exist "%NETWORK_PATH%\uploads\avatars" mkdir "%NETWORK_PATH%\uploads\avatars"
if not exist "%NETWORK_PATH%\uploads\complaints" mkdir "%NETWORK_PATH%\uploads\complaints"
if not exist "%NETWORK_PATH%\uploads\company-policies" mkdir "%NETWORK_PATH%\uploads\company-policies"
if not exist "%NETWORK_PATH%\uploads\attendance" mkdir "%NETWORK_PATH%\uploads\attendance"
echo ✅ Upload directories verified
echo.

echo ════════════════════════════════════════
echo ✅ DEPLOYMENT COMPLETE!
echo ════════════════════════════════════════
echo.
echo Files deployed to: %NETWORK_PATH%
echo.
echo IMPORTANT: YOU MUST NOW RESTART THE SERVER
echo.
echo Options to restart:
echo 1. Remote Desktop to %SERVER_IP% and restart manually
echo 2. Use PSExec: psexec \\%SERVER_IP% pm2 restart hrms-backend
echo 3. SSH to server (if enabled) and run: pm2 restart hrms-backend
echo.
echo After restart, verify:
echo   http://%SERVER_IP%:4000/uploads/_debug/info
echo.
pause
