# GitHub Sync Production Verification Script
# This script verifies the complete GitHub sync pipeline

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GitHub Sync Production Verification" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0
$warnings = 0

# Function to check status
function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$ErrorMessage = "Failed",
        [bool]$Critical = $true
    )
    
    Write-Host "[CHECK] $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " OK" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            if ($Critical) {
                Write-Host " FAILED" -ForegroundColor Red
                Write-Host "  Error: $ErrorMessage" -ForegroundColor Red
                $script:failed++
            } else {
                Write-Host " WARNING" -ForegroundColor Yellow
                Write-Host "  Warning: $ErrorMessage" -ForegroundColor Yellow
                $script:warnings++
            }
            return $false
        }
    } catch {
        if ($Critical) {
            Write-Host " FAILED" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:failed++
        } else {
            Write-Host " WARNING" -ForegroundColor Yellow
            Write-Host "  Warning: $($_.Exception.Message)" -ForegroundColor Yellow
            $script:warnings++
        }
        return $false
    }
}

Write-Host "Running pre-flight checks..." -ForegroundColor Cyan
Write-Host ""

# Ensure we fail fast on command errors we explicitly invoke
$ErrorActionPreference = "Stop"

# 1. Check Node.js
Test-Component -Name "Node.js installed" -Test {
    $nodeVersion = node --version 2>$null
    return $nodeVersion -ne $null
} -ErrorMessage "Node.js is not installed or not in PATH"

# 2. Check npm
Test-Component -Name "npm installed" -Test {
    $npmVersion = npm --version 2>$null
    return $npmVersion -ne $null
} -ErrorMessage "npm is not installed or not in PATH"

# 3. Check dependencies installed
Test-Component -Name "node_modules exists" -Test {
    return Test-Path "node_modules"
} -ErrorMessage "Run 'npm install' first"

# 4. Check .env file
Test-Component -Name ".env file exists" -Test {
    return Test-Path ".env"
} -ErrorMessage ".env file not found"

# 5. Check database connection
Write-Host "[CHECK] Database connectivity..." -NoNewline
try {
    $dbCheck = "SELECT 1;" | npx prisma db execute --stdin | Out-String
    if ($LASTEXITCODE -eq 0 -and $dbCheck -notmatch "error|failed|P[0-9]{4}") {
        Write-Host " OK" -ForegroundColor Green
        $passed++
    } else {
        throw "Could not verify database connectivity"
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# 6. Check Redis connection
Write-Host "[CHECK] Redis connectivity..." -NoNewline
try {
    $redisTest = redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host " OK" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: Redis is not running. Start with 'redis-server' or 'docker-compose up -d redis'" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "  Error: Redis CLI not found. Install Redis first." -ForegroundColor Red
    $failed++
}

# 7. Check required environment variables
$requiredEnvVars = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "ENCRYPTION_KEY",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "REDIS_HOST",
    "REDIS_PORT",
    "CRON_SECRET"
)

foreach ($envVar in $requiredEnvVars) {
    Test-Component -Name "ENV: $envVar" -Test {
        $content = Get-Content .env -Raw
        return $content -match "$envVar="
    } -ErrorMessage "$envVar is not set in .env" -Critical $true
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " API Health Checks" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start dev server in background if not running
Write-Host "Checking if dev server is running..." -ForegroundColor Cyan
$devServerRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Dev server is already running" -ForegroundColor Green
        $devServerRunning = $true
    }
} catch {
    Write-Host "Dev server is not running. Please start it manually:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Skipping API health checks..." -ForegroundColor Yellow
}

if ($devServerRunning) {
    # Check health endpoints
    Write-Host "[CHECK] /api/health/redis..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health/redis" -Method GET -TimeoutSec 5
        if ($response.redisConnected -eq $true) {
            Write-Host " OK" -ForegroundColor Green
            Write-Host "  Queue stats: Waiting=$($response.queueStatus.waiting), Active=$($response.queueStatus.active), Completed=$($response.queueStatus.completed), Failed=$($response.queueStatus.failed)" -ForegroundColor Gray
            $passed++
        } else {
            Write-Host " FAILED" -ForegroundColor Red
            Write-Host "  Error: $($response.error)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }

    Write-Host "[CHECK] /api/health/github-sync..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health/github-sync" -Method GET -TimeoutSec 5
        if ($response.status -eq "healthy" -or $response.status -eq "degraded") {
            Write-Host " OK ($($response.status))" -ForegroundColor Green
            Write-Host "  Redis: $($response.checks.redis.message)" -ForegroundColor Gray
            Write-Host "  Queue: $($response.checks.queue.message)" -ForegroundColor Gray
            Write-Host "  Encryption: $($response.checks.encryption.message)" -ForegroundColor Gray
            Write-Host "  Database: $($response.checks.database.message)" -ForegroundColor Gray
            Write-Host "  Worker: $($response.checks.worker.message)" -ForegroundColor Gray
            $passed++
        } else {
            Write-Host " WARNING" -ForegroundColor Yellow
            Write-Host "  Status: $($response.status)" -ForegroundColor Yellow
            $warnings++
        }
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Verification Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Warnings: $warnings" -ForegroundColor Yellow
Write-Host ""

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "All checks passed! System is ready for production." -ForegroundColor Green
    exit 0
} elseif ($failed -eq 0) {
    Write-Host "System is operational with minor warnings." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Critical failures detected. Please fix the issues above." -ForegroundColor Red
    exit 1
}
