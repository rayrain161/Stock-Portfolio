@echo off
echo Starting Stock Position Tracker...
cd /d "d:\NYCU\stock_position"

:: Open the browser to the localhost URL
start "" "http://localhost:5173"

:: Start the Vite development server
echo Starting Vite server...
npm run dev

pause
