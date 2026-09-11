@echo off
REM =========================================
REM Production Deployment Script - Full Deploy
REM =========================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║   PRODUCTION DEPLOYMENT - HRMS Backend         ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Set production path
set PROD_PATH=C:\xampp\htdocs\HRMS\backend

echo [1/6] Checking TypeScript compilation...
call npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript compilation failed!
    pause
    exit /b 1
)
echo ✅ TypeScript compilation passed
echo.

echo [2/6] Building NestJS application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully
echo.

echo [3/6] Verifying production path...
if not exist "%PROD_PATH%" (
    echo ❌ Production path does not exist: %PROD_PATH%
    echo    Please ensure the production server directory exists.
    pause
    exit /b 1
)
echo ✅ Production path verified: %PROD_PATH%
echo.

echo [4/6] Copying dist folder to production...
if exist "%PROD_PATH%\dist" (
    echo    Removing old dist folder...
    rmdir /s /q "%PROD_PATH%\dist"
)
xcopy /E /I /Y "dist" "%PROD_PATH%\dist"
if errorlevel 1 (
    echo ❌ Failed to copy dist folder!
    pause
    exit /b 1
)
echo ✅ Dist folder copied successfully
echo.

echo [5/6] Ensuring uploads directories exist in production...
if not exist "%PROD_PATH%\uploads" mkdir "%PROD_PATH%\uploads"
if not exist "%PROD_PATH%\uploads\documents" mkdir "%PROD_PATH%\uploads\documents"
if not exist "%PROD_PATH%\uploads\avatars" mkdir "%PROD_PATH%\uploads\avatars"
if not exist "%PROD_PATH%\uploads\complaints" mkdir "%PROD_PATH%\uploads\complaints"
if not exist "%PROD_PATH%\uploads\company-policies" mkdir "%PROD_PATH%\uploads\company-policies"
if not exist "%PROD_PATH%\uploads\attendance" mkdir "%PROD_PATH%\uploads\attendance"
echo ✅ Uploads directories verified
echo.

echo [6/6] Deployment Complete!
echo ════════════════════════════════════════
echo ✅ All files deployed to: %PROD_PATH%
echo.
echo NEXT STEPS:
echo 1. Verify .env file exists in production: %PROD_PATH%\.env
echo 2. Ensure UPLOAD_DIR=./uploads in .env
echo 3. Restart the production server
echo.
echo TO RESTART THE SERVER:
echo   - If using PM2: pm2 restart hrms-backend
echo   - If running directly: Stop and restart: node dist/src/main.js
echo.
echo AFTER RESTART:
echo   - Check server logs for initialization messages
echo   - Test document access: http://192.168.1.14:4000/uploads/documents/[filename]
echo   - Look for detailed path information in server console
echo.
echo ════════════════════════════════════════
echo.
pause
