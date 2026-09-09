@echo off
title Tunnel - Cloudflare
echo Starting Cloudflare Tunnel...
echo COPY the https://xxxx.trycloudflare.com URL shown below.
echo Then run 3_deploy_frontend.bat and paste it when asked.
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8001
pause
