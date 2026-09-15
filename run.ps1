# Run Project Script

$root = Get-Location

Write-Host "🚀 Starting Architect AI project..." -ForegroundColor Cyan

# Start Frontend (Next.js)
Write-Host "🚀 Starting ArchitectAI (Frontend)..." -ForegroundColor Yellow
$frontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev" -WindowStyle Normal -PassThru

Write-Host "✅ Both services are starting in new windows." -ForegroundColor Green
Write-Host "⚠️  DO NOT CLOSE THIS WINDOW or press Ctrl+C unless you want to stop all services." -ForegroundColor Red

try {
    # Keep the script running as long as the child processes are alive or until user interrupts
    while ($backendProc.HasExited -eq $false -or $frontendProc.HasExited -eq $false) {
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Red
    
    # Kill the backend process and its children if possible
    if ($backendProc -and !$backendProc.HasExited) {
        Write-Host "Killing Backend..."
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Kill the frontend process and its children if possible
    if ($frontendProc -and !$frontendProc.HasExited) {
        Write-Host "Killing Frontend..."
        Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue
    }

    # Backup cleanup for node/python just in case
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*main.py*" } | Stop-Process -Force

    Write-Host "🏁 Cleanup complete." -ForegroundColor Cyan
}
