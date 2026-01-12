# WeVote Backend Startup Script
# This ensures the backend always starts from the correct directory

$backendPath = Join-Path $PSScriptRoot "backend"

Write-Host "`n🚀 Starting WeVote Backend Server..." -ForegroundColor Cyan
Write-Host "Location: $backendPath`n" -ForegroundColor Gray

Set-Location $backendPath
npm start
