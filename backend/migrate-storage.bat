@echo off
setlocal enabledelayedexpansion

echo ========================================================================
echo HRMS DOCUMENT STORAGE MIGRATION
echo ========================================================================
echo.
echo This script will:
echo   1. Create persistent storage at: C:\HRMS_STORAGE\uploads
echo   2. Copy existing files from: backend\uploads
echo   3. Preserve all original files (non-destructive)
echo   4. Skip files that already exist in destination
echo.
echo IMPORTANT: NO files will be deleted
echo ========================================================================
echo.

set "SOURCE=%~dp0uploads"
set "DEST=C:\HRMS_STORAGE\uploads"

echo Source: %SOURCE%
echo Destination: %DEST%
echo.

:: Create destination folders
echo Creating destination folders...
if not exist "%DEST%\documents" mkdir "%DEST%\documents"
if not exist "%DEST%\avatars" mkdir "%DEST%\avatars"
if not exist "%DEST%\complaints" mkdir "%DEST%\complaints"
if not exist "%DEST%\company-policies" mkdir "%DEST%\company-policies"
if not exist "%DEST%\attendance" mkdir "%DEST%\attendance"
echo Done.
echo.

:: Function to copy folder
set TOTAL_COPIED=0
set TOTAL_SKIPPED=0

for %%F in (documents avatars complaints company-policies attendance) do (
    echo Processing folder: %%F
    if exist "%SOURCE%\%%F" (
        for %%A in ("%SOURCE%\%%F\*.*") do (
            if exist "%DEST%\%%F\%%~nxA" (
                echo   SKIP: %%~nxA (already exists)
                set /a TOTAL_SKIPPED+=1
            ) else (
                copy /Y "%%A" "%DEST%\%%F\" >nul 2>&1
                if !errorlevel! equ 0 (
                    echo   COPY: %%~nxA
                    set /a TOTAL_COPIED+=1
                ) else (
                    echo   ERROR: %%~nxA
                )
            )
        )
    ) else (
        echo   Source folder does not exist, skipping.
    )
    echo.
)

echo ========================================================================
echo MIGRATION COMPLETE
echo ========================================================================
echo Files copied: %TOTAL_COPIED%
echo Files skipped (already exist): %TOTAL_SKIPPED%
echo.
echo Original files preserved in: %SOURCE%
echo New storage location: %DEST%
echo.
echo Next steps:
echo   1. Verify files in C:\HRMS_STORAGE\uploads
echo   2. Update .env: UPLOAD_DIR=C:/HRMS_STORAGE/uploads
echo   3. Restart backend server
echo   4. Test document access
echo.
echo ========================================================================

pause
