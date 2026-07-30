@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo      Job Application Automation - Docker Build
echo ===============================================

:: Try to find docker executable
set "DOCKER_CMD=docker"
where docker >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "DOCKER_DIR=C:\Program Files\Docker\Docker\resources\bin"
        set "DOCKER_CMD="!DOCKER_DIR!\docker.exe""
        set "PATH=!DOCKER_DIR!;%PATH%"
    ) else (
        echo [ERROR] Docker not found in PATH or standard locations.
        pause
        exit /b 1
    )
)

echo [INFO] Using Docker at: %DOCKER_CMD%
echo [INFO] Docker is running. Building images...

:: Build the services (Force legacy builder for compatibility if needed, or default)
:: Use DOCKER_BUILDKIT=0 if you face issues
set DOCKER_BUILDKIT=0
%DOCKER_CMD% compose build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed. check the logs above.
    pause
    exit /b 1
)

echo [SUCCESS] Images built successfully!
echo.
echo ===============================================
echo      Publishing to Docker Hub (Optional)
echo ===============================================
echo.
echo To publish these images so they can be downloaded on other platforms,
echo you need to tag them with your Docker Hub username.
echo.

set /p PUSH="Do you want to publish to Docker Hub now? (y/n): "
if /i "%PUSH%" neq "y" goto END

set /p DOCKER_USER="Enter your Docker Hub username: "
set /p VERSION_TAG="Enter version tag (default: latest): "
if "%VERSION_TAG%"=="" set VERSION_TAG=latest

echo.
echo [INFO] Logging in to Docker Hub...
%DOCKER_CMD% login
if %errorlevel% neq 0 (
    echo [ERROR] Login failed.
    goto END
)

echo.
echo [INFO] Tagging images...
:: Tag Backend
%DOCKER_CMD% tag naukri-automation-fullstack-backend:latest %DOCKER_USER%/naukri-backend:%VERSION_TAG%
:: Tag Frontend
%DOCKER_CMD% tag naukri-automation-fullstack-frontend:latest %DOCKER_USER%/naukri-frontend:%VERSION_TAG%

echo.
echo [INFO] Pushing images...
%DOCKER_CMD% push %DOCKER_USER%/naukri-backend:%VERSION_TAG%
%DOCKER_CMD% push %DOCKER_USER%/naukri-frontend:%VERSION_TAG%

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Images published to Docker Hub!
    echo You can now pull them on another machine using:
    echo docker pull %DOCKER_USER%/naukri-backend:%VERSION_TAG%
    echo docker pull %DOCKER_USER%/naukri-frontend:%VERSION_TAG%
) else (
    echo [ERROR] Push failed.
)

:END
echo.
echo Press any key to exit...
pause
