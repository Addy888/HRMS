@echo off
REM =========================================
REM Upload Route Fix - Deployment Script
REM =========================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║   Upload Route Fix - Deployment Script        ║
echo ╚════════════════════════════════════════════════╝
echo.

echo [1/4] Checking TypeScript compilation...
call npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript compilation failed!
    pause
    exit /b 1
)
echo ✅ TypeScript compilation passed
echo.

echo [2/4] Building NestJS application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully
echo.

echo [3/4] Checking uploads directory...
if not exist "uploads\documents" (
    echo Creating uploads\documents directory...
    mkdir "uploads\documents"
)
if not exist "uploads\avatars" (
    echo Creating uploads\avatars directory...
    mkdir "uploads\avatars"
)
if not exist "uploads\complaints" (
    echo Creating uploads\complaints directory...
    mkdir "uploads\complaints"
)
if not exist "uploads\company-policies" (
    echo Creating uploads\company-policies directory...
    mkdir "uploads\company-policies"
)
if not exist "uploads\attendance" (
    echo Creating uploads\attendance directory...
    mkdir "uploads\attendance"
)
echo ✅ Uploads directories verified
echo.

echo [4/4] Deployment Summary
echo ════════════════════════════════════════
echo ✅ All checks passed!
echo ✅ Application built successfully
echo ✅ Ready for deployment
echo.
echo NEXT STEPS:
echo 1. Copy the 'dist' folder to server (192.168.1.14)
echo 2. Copy the 'uploads' folder to server (if not already there)
echo 3. Copy 'package.json' and 'package-lock.json' to server
echo 4. Copy '.env' file to server
echo 5. On server, run: npm ci --production
echo 6. On server, restart the application
echo.
echo FOR PM2 DEPLOYMENT:
echo   pm2 restart hrms-backend
echo.
echo FOR DIRECT DEPLOYMENT:
echo   node dist/src/main.js
echo.
echo ════════════════════════════════════════
echo.
pause
