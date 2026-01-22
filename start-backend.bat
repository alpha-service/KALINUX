@echo off
cd /d %~dp0
start /B node backend-server.js
echo Backend server started
