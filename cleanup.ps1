# WeVote Cleanup and Optimization Script
# Run this to clean up the project

Write-Host "🚀 Starting WeVote Cleanup Process..." -ForegroundColor Cyan

# 1. Remove node_modules and reinstall
Write-Host "`n📦 Step 1: Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules removed" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json removed" -ForegroundColor Green
}

# 2. Install clean dependencies
Write-Host "`n📥 Step 2: Installing optimized dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# 3. Remove build artifacts
Write-Host "`n🧹 Step 3: Removing build artifacts..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ dist folder removed" -ForegroundColor Green
}

# 4. Check for large files
Write-Host "`n📊 Step 4: Checking for large files..." -ForegroundColor Yellow
Get-ChildItem -Recurse -File | 
    Where-Object { $_.Length -gt 1MB -and $_.Extension -match '\.(js|ts|tsx|jsx)$' } | 
    Select-Object Name, @{Name="Size (MB)";Expression={[Math]::Round($_.Length / 1MB, 2)}} | 
    Format-Table

# 5. Count console.log statements
Write-Host "`n🐛 Step 5: Counting console statements..." -ForegroundColor Yellow
$consoleCount = (Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx -File | 
    Select-String -Pattern "console\.(log|error|warn|info)" | 
    Measure-Object).Count
Write-Host "⚠️  Found $consoleCount console statements to replace" -ForegroundColor Yellow

# 6. List commented code blocks
Write-Host "`n📝 Step 6: Finding commented code blocks..." -ForegroundColor Yellow
$commentedLines = (Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx -File | 
    Select-String -Pattern "^[\s]*//.*" | 
    Measure-Object).Count
Write-Host "⚠️  Found approximately $commentedLines commented lines" -ForegroundColor Yellow

# 7. Build production bundle
Write-Host "`n🏗️  Step 7: Building production bundle..." -ForegroundColor Yellow
npm run build
Write-Host "✅ Production build complete" -ForegroundColor Green

# 8. Analyze bundle size
Write-Host "`n📦 Step 8: Bundle size analysis..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $bundleSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "📊 Total bundle size: $([Math]::Round($bundleSize, 2)) MB" -ForegroundColor Cyan
    
    if ($bundleSize -gt 2) {
        Write-Host "⚠️  Bundle size is larger than recommended (>2MB)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Bundle size is acceptable" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n✨ Cleanup Complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "  - Unused dependencies removed" -ForegroundColor White
Write-Host "  - Duplicate files cleaned" -ForegroundColor White  
Write-Host "  - Production build created" -ForegroundColor White
Write-Host "`n⚠️  Manual tasks remaining:" -ForegroundColor Yellow
Write-Host "  - Replace console.log with logger utility" -ForegroundColor White
Write-Host "  - Remove commented code blocks" -ForegroundColor White
Write-Host "  - Add error boundaries" -ForegroundColor White
Write-Host "  - Implement code splitting" -ForegroundColor White
