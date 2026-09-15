@echo off
echo Stopping Next.js dev server...
taskkill /F /PID 17780
timeout /t 2
echo Starting dev server with fresh environment variables...
start cmd /k "npm run dev"
echo.
echo Dev server restarting in new window!
echo Wait for "Ready" message, then refresh your browser.
