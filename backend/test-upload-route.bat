@echo off
REM =========================================
REM Upload Route Test Script
REM =========================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════╗
echo ║   Upload Route Test Script                     ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Get server address from user
set /p SERVER_IP="Enter server IP address (default: localhost): "
if "%SERVER_IP%"=="" set SERVER_IP=localhost

set /p SERVER_PORT="Enter server port (default: 4000): "
if "%SERVER_PORT%"=="" set SERVER_PORT=4000

set BASE_URL=http://%SERVER_IP%:%SERVER_PORT%

echo.
echo Testing server: %BASE_URL%
echo.

REM Test 1: Health check
echo [Test 1/3] Testing API health endpoint...
curl -s -o nul -w "%%{http_code}" %BASE_URL%/api/v1/health > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="200" (
    echo ✅ Health check passed [HTTP %STATUS%]
) else (
    echo ❌ Health check failed [HTTP %STATUS%]
    echo    Server might not be running or unreachable
    pause
    exit /b 1
)
echo.

REM Test 2: Check for existing files
echo [Test 2/3] Checking for uploaded documents...
set FOUND_FILE=
for %%F in (uploads\documents\*.pdf) do (
    set FOUND_FILE=%%~nxF
    goto :found
)
:found

if "%FOUND_FILE%"=="" (
    echo ⚠️  No PDF files found in uploads\documents\
    echo    Upload a test file first
    echo.
    pause
    exit /b 0
)

echo Found test file: %FOUND_FILE%
echo.

REM Test 3: Test upload route
echo [Test 3/3] Testing upload document route...
echo Requesting: %BASE_URL%/uploads/documents/%FOUND_FILE%
echo.

curl -s -I "%BASE_URL%/uploads/documents/%FOUND_FILE%" > temp_response.txt

findstr /C:"HTTP/1.1 200" temp_response.txt > nul
if errorlevel 1 (
    echo ❌ Upload route test FAILED
    echo.
    echo Response headers:
    type temp_response.txt
    echo.
    echo TROUBLESHOOTING:
    echo 1. Check if UploadsModule is imported in AppModule
    echo 2. Check route exclusion in main.ts
    echo 3. Check server console for "UPLOAD DOCUMENT ROUTE HIT" log
    echo 4. Verify the file exists in uploads\documents\
    echo.
) else (
    findstr /C:"Content-Type: application/pdf" temp_response.txt > nul
    if errorlevel 1 (
        echo ⚠️  Upload route returned 200 but wrong Content-Type
        type temp_response.txt
    ) else (
        echo ✅ Upload route test PASSED
        echo.
        echo Response headers:
        findstr /C:"HTTP/1.1" temp_response.txt
        findstr /C:"Content-Type" temp_response.txt
        findstr /C:"Content-Length" temp_response.txt
        findstr /C:"Content-Disposition" temp_response.txt
    )
)

del temp_response.txt

echo.
echo ════════════════════════════════════════
echo Test completed!
echo ════════════════════════════════════════
echo.
echo Check server console for detailed logs:
echo   UPLOAD DOCUMENT ROUTE HIT: %FOUND_FILE%
echo   📄 Serving file: documents/%FOUND_FILE%
echo   ✅ File exists (SIZE bytes)
echo.
pause
