# Setup Script for Architect AI
# Configures Frontend and checks for Ollama.

Write-Host "Starting Environment Setup..." -ForegroundColor Cyan

# 1. Install Frontend Dependencies
Write-Host "📦 Installing Frontend Dependencies..."
if (Test-Path "package.json") {
    npm install
    npm install web-tree-sitter
}

# 2. Check for Gemini
Write-Host "💎 Checking Gemini Configuration..."
if ($env:GEMINI_API_KEY -or (Test-Path ".env.local" -and (Select-String -Path ".env.local" -Pattern "GEMINI_API_KEY"))) {
    Write-Host "✅ Gemini API Key found."
} else {
    Write-Host "⚠️  Gemini API Key NOT found in .env.local"
    Write-Host "   Please add your API key: GEMINI_API_KEY=your_key_here"
}

Write-Host "✅ Setup Complete. Run .\run.ps1 to start." -ForegroundColor Green
