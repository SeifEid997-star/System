@echo off
TITLE PetPals Clinic - One-Click Launcher
COLOR 0B
CLS

echo =======================================================
echo          PETPALS VETERINARY CLINIC (QLINIC v2)
echo            Daily Workstation Instant Launcher
echo =======================================================
echo.

cd /d "%~dp0"

if not exist ".env.local" (
    echo [*] Creating a private session-signing secret for this installation...
    node -e "require('fs').writeFileSync('.env.local','AUTH_SECRET='+require('crypto').randomBytes(48).toString('hex'))"
    if errorlevel 1 (
        echo [!] Could not create AUTH_SECRET. Ensure Node.js is installed.
        pause
        exit /b 1
    )
)

if not exist ".next\BUILD_ID" (
    echo [*] Creating the optimized local build (first run only)...
    call npm run build
    if errorlevel 1 (
        echo [!] Could not create the optimized build. Please use publish-clinic.bat to see the full error.
        pause
        exit /b 1
    )
)

echo [*] Launching the optimized Qlinic local server...
start /B cmd /c npm run start > nul 2>&1

echo [*] Waiting 3 seconds for database & server connection...
timeout /t 3 /nobreak > nul

echo [*] Launching Qlinic in Desktop App Mode...
set BROWSER_LAUNCHED=0

rem Check for Microsoft Edge (installed on all Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000/login
    set BROWSER_LAUNCHED=1
)

rem Check for Google Chrome
if %BROWSER_LAUNCHED%==0 (
    if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
        start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000/login
        set BROWSER_LAUNCHED=1
    )
)

rem Fallback to default system browser
if %BROWSER_LAUNCHED%==0 (
    start "" "http://localhost:3000/login"
)


echo.
echo =======================================================
echo  Qlinic is running! Keep this window open during clinic hours.
echo  To close the system, simply close this window.
echo =======================================================
pause
