
@echo off
echo Starting Dice Color Modifier Application...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for dependencies and install if needed
echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

:: Start the WebSocket server in a new command window
start cmd /k "echo Starting WebSocket Server... && cd websocket_server && node server.js"

:: Wait a bit for the WebSocket server to start
timeout /t 3 /nobreak >nul

:: Start the Discord bot
echo Starting Discord Bot...
cd discord_bot && node index.js

:: This part will only execute if the Discord bot exits
echo Application has stopped.
pause
exit /b 0