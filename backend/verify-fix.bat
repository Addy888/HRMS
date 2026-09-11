@echo off
echo.
echo ========================================================================
echo DOCUMENT STORAGE VERIFICATION
echo ========================================================================
echo.

echo [1/3] Running storage diagnostics...
node debug-storage.js

echo.
echo [2/3] TypeScript compilation check...
call npx tsc --noEmit
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed
    exit /b 1
)
echo ✅ TypeScript compilation passed

echo.
echo [3/3] Build verification...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)
echo ✅ Build successful

echo.
echo ========================================================================
echo ✅ VERIFICATION COMPLETE
echo ========================================================================
echo.
echo Next steps:
echo   1. Review the storage diagnostics above
echo   2. If orphaned files exist, run: node restore-documents.js
echo   3. Start server: npm run start:dev
echo   4. Test document upload and viewing
echo.
echo For detailed analysis, see: DOCUMENT-STORAGE-FIX-REPORT.md
echo.

pause
