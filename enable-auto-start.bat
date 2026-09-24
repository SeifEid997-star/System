@echo off
TITLE PetPals Clinic - Enable Windows Auto-Start
COLOR 0A
CLS

echo =======================================================
echo     PETPALS CLINIC - ENABLE AUTO START ON WINDOWS BOOT
echo =======================================================
echo.
echo [*] Creating startup shortcut in Windows Startup folder...

set SCRIPT="%TEMP%\CreatePetPalsShortcut.vbs"
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set TARGET=%~dp0start-clinic-silent.vbs
set WORKING_DIR=%~dp0
set SHORTCUT=%STARTUP_DIR%\PetPals-Clinic.lnk

echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%SHORTCUT%" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "wscript.exe" >> %SCRIPT%
echo oLink.Arguments = """%TARGET%""" >> %SCRIPT%
echo oLink.WorkingDirectory = "%WORKING_DIR%" >> %SCRIPT%
echo oLink.Description = "PetPals Clinic Auto Launcher" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo [SUCCESS] Auto-start has been configured successfully!
echo [INFO] Whenever this computer turns on, PetPals Clinic will launch
echo        automatically in the background and open the clinic login screen!
echo.
echo =======================================================
pause
