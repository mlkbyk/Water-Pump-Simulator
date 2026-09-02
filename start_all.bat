@echo off
cd /d "%~dp0"
title SCADA Simulator Launcher
echo ======================================================================
echo    KUYU VE TERFI ISTASYONU 3-KATMANLI SCADA SIMULASYONU BASLATICI
echo ======================================================================
echo.

echo [1/3] Katman 1: Python Modbus TCP Sunucusu baslatiliyor (Port: 5020)...
start "Katman 1 - Python Modbus TCP Server" cmd /k "cd /d "%~dp0" && python simulation_engine/server.py"
timeout /t 2 /nobreak > nul

echo [2/3] Katman 2: Node.js WebSocket Middleware baslatiliyor (Port: 4000)...
start "Katman 2 - Node.js Middleware & Socket.IO" cmd /k "cd /d "%~dp0\backend_middleware" && npm start"
timeout /t 2 /nobreak > nul

echo [3/3] Katman 3: React SCADA Web Dashboard baslatiliyor (Port: 5173)...
start "Katman 3 - React SCADA Web UI" cmd /k "cd /d "%~dp0\frontend_ui" && npm run dev"

echo.
echo ======================================================================
echo    TUM KATMANLAR BASARIYLA AYAGA KALDIRILDI!
echo    * Web Arayuzu: http://localhost:5173
echo    * WebSocket API: http://localhost:4000
echo    * Modbus Server: 127.0.0.1:5020
echo ======================================================================
echo.
pause
