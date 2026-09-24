@echo off
TITLE PetPals Clinic - Disable Windows Auto-Start
COLOR 0C
CLS

echo =======================================================
echo    PETPALS CLINIC - DISABLE AUTO START ON BOOT
echo =======================================================
echo.

set SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PetPals-Clinic.lnk

if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo [SUCCESS] Auto-start shortcut removed successfully!
) else (
    echo [INFO] No auto-start shortcut was found in Startup folder.
)

echo.
pause
