@echo off
title Deploy Frontend
cls
echo ============================================================
echo                    DEPLOY FRONTEND TO FIREBASE
echo ============================================================
echo.
echo Paste your Cloudflare Tunnel URL below.
echo Example: https://maiden-basic-comics-newest.trycloudflare.com
echo.

set /p RAW_URL="Tunnel URL: "

if "%RAW_URL%"=="" (
    echo [ERROR] No URL entered!
    pause
    exit /b 1
)

rem Clean up quotes, spaces, and protocol prefixes using pure batch
set "CLEAN=%RAW_URL:"=%"
set "CLEAN=%CLEAN: =%"
set "CLEAN=%CLEAN:https://=%"
set "CLEAN=%CLEAN:http://=%"
set "CLEAN=%CLEAN:/=%"

if "%CLEAN%"=="" (
    echo [ERROR] Invalid Tunnel URL!
    pause
    exit /b 1
)

set "FINAL_URL=https://%CLEAN%"

echo.
echo Writing .env.production with URL: %FINAL_URL%
(
    echo VITE_API_URL=%FINAL_URL%
) > "%~dp0Naukri Frontend\naukri-frontend\.env.production"

echo.
echo Building React app...
cd /d "%~dp0Naukri Frontend\naukri-frontend"
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo Deploying to Firebase...
call firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Firebase deployment failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Done! App is live at: https://naukri-automation-sagar.web.app
echo ============================================================
pause
