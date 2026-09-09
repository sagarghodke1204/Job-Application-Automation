@echo off
title Backend - FastAPI
cd /d "%~dp0naukri-automation-api"
call venv\Scripts\activate
python main.py
pause
