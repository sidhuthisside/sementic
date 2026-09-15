@echo off
echo Stopping Next.js dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Next.js dev server...
cd /d "%~dp0"
start cmd /k "npm run dev"

echo.
echo Dev server restarted! Check the new window for the server output.
echo Navigate to http://localhost:3000
pause
