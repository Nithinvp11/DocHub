# Simple Production Verification Script
# Quick checks for essential components

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Production Setup Verification" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

# Check Node.js
Write-Host "[CHECK] Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host " OK ($nodeVersion)" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    $failed++
}

# Check npm
Write-Host "[CHECK] npm..." -NoNewline
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host " OK ($npmVersion)" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    $failed++
}

# Check node_modules
Write-Host "[CHECK] node_modules..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " OK" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAILED (run: npm install)" -ForegroundColor Red
    $failed++
}

# Check .env file
Write-Host "[CHECK] .env file..." -NoNewline
if (Test-Path ".env") {
    Write-Host " OK" -ForegroundColor Green
    $passed++
} else {
    Write-Host " FAILED" -ForegroundColor Red
    $failed++
}

# Check Redis
Write-Host "[CHECK] Redis (Docker)..." -NoNewline
try {
    $redisTest = docker exec repo-aware-redis redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host " OK (PONG)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    $failed++
}

# Check environment variables
Write-Host "[CHECK] Environment variables..." -NoNewline
$envContent = Get-Content .env -Raw
$requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "ENCRYPTION_KEY", "GITHUB_CLIENT_ID", "REDIS_HOST")
$allFound = $true
foreach ($var in $requiredVars) {
    if (-not ($envContent -match "$var=")) {
        $allFound = $false
        break
    }
}
if ($allFound) {
    Write-Host " OK" -ForegroundColor Green
    $passed++
} else {
    Write-Host " MISSING VARIABLES" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Results" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Open Terminal 1: npm run worker:github-sync" -ForegroundColor Yellow
    Write-Host "  2. Open Terminal 2: npm run dev" -ForegroundColor Yellow
    Write-Host "  3. Open browser: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✗ Some checks failed. Please fix the issues above." -ForegroundColor Red
}
