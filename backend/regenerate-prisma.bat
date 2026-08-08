@echo off
echo ================================================
echo Prisma Client Regeneration Script
echo ================================================
echo.
echo This script will regenerate the Prisma client
echo to fix TypeScript errors after schema changes.
echo.
echo INSTRUCTIONS:
echo 1. Close VS Code completely
echo 2. Stop the backend server if running
echo 3. Run this script
echo 4. Reopen VS Code
echo.
echo ================================================
echo.

echo Cleaning old Prisma client...
rmdir /s /q node_modules\.prisma 2>nul

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
echo ================================================
echo Done! You can now restart VS Code.
echo ================================================
pause
