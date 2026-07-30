@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo      Job Application Automation - Run App
echo ===============================================

:: Try to find docker executable
set "DOCKER_CMD=docker"
where docker >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "DOCKER_DIR=C:\Program Files\Docker\Docker\resources\bin"
        set "DOCKER_CMD="C:\Program Files\Docker\Docker\resources\bin\docker.exe""
        set "PATH=C:\Program Files\Docker\Docker\resources\bin;%PATH%"
    ) else (
        echo [ERROR] Docker not found in PATH or standard locations.
        pause
        exit /b 1
    )
)

echo [INFO] Using Docker at: %DOCKER_CMD%

echo [INFO] Stopping any existing containers...
%DOCKER_CMD% compose down

echo [INFO] Starting application...
%DOCKER_CMD% compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Application started!
    echo Backend: http://localhost:8001/docs
    echo Frontend: http://localhost:80
    echo.
    echo Logs are streaming below (Press Ctrl+C to stop logs, app will keep running):
    echo ---------------------------------------------------------------------------
    %DOCKER_CMD% compose logs -f
) else (
    echo [ERROR] Failed to start application.
    pause
)
