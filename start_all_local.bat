@echo off
echo ===============================================
echo      Starting Naukri Automation Locally
echo ===============================================

echo.
echo [INFO] Starting Backend API (Port 8001)...
cd naukri-automation-api
start "Naukri Backend API" cmd /k "call venv\Scripts\activate && python main.py"
cd ..

echo.
echo [INFO] Starting Frontend Dev Server (Vite)...
cd "Naukri Frontend\naukri-frontend"
start "Naukri Frontend" cmd /k "npm run dev"
cd ..\..

echo.
echo [SUCCESS] Both servers are starting in separate windows!
echo Backend logs will appear in the "Naukri Backend API" window.
echo Frontend logs will appear in the "Naukri Frontend" window.
echo.
pause
