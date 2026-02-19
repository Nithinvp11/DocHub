# Redis Installation Script for Windows
# This script installs Redis using Chocolatey or provides manual installation steps

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Redis Installation for Windows " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Option 1: Check if Chocolatey is installed
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "[OPTION 1] Installing Redis via Chocolatey..." -ForegroundColor Green
    Write-Host ""
    
    try {
        choco install redis-64 -y
        Write-Host ""
        Write-Host "Redis installed successfully via Chocolatey!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To start Redis:" -ForegroundColor Cyan
        Write-Host "  redis-server" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To test Redis:" -ForegroundColor Cyan
        Write-Host "  redis-cli ping" -ForegroundColor Yellow
        Write-Host "  (should return: PONG)" -ForegroundColor Gray
        exit 0
    } catch {
        Write-Host "Failed to install Redis via Chocolatey" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Chocolatey is not installed." -ForegroundColor Yellow
    Write-Host ""
}

# Option 2: Docker
Write-Host "[OPTION 2] Using Docker (Recommended)" -ForegroundColor Green
Write-Host ""
Write-Host "If you have Docker Desktop installed:" -ForegroundColor Cyan
Write-Host "  1. cd to your project directory" -ForegroundColor White
Write-Host "  2. Run: docker-compose up -d redis" -ForegroundColor Yellow
Write-Host "  3. Test: docker exec repo-aware-redis redis-cli ping" -ForegroundColor Yellow
Write-Host ""

# Option 3: WSL
Write-Host "[OPTION 3] Using WSL (Windows Subsystem for Linux)" -ForegroundColor Green
Write-Host ""
Write-Host "Install WSL and Redis:" -ForegroundColor Cyan
Write-Host "  1. wsl --install" -ForegroundColor Yellow
Write-Host "  2. Restart your computer" -ForegroundColor Yellow
Write-Host "  3. Open WSL terminal" -ForegroundColor Yellow
Write-Host "  4. sudo apt-get update" -ForegroundColor Yellow
Write-Host "  5. sudo apt-get install redis-server" -ForegroundColor Yellow
Write-Host "  6. redis-server --daemonize yes" -ForegroundColor Yellow
Write-Host "  7. redis-cli ping" -ForegroundColor Yellow
Write-Host ""

# Option 4: Memurai (Redis for Windows)
Write-Host "[OPTION 4] Memurai (Redis-compatible for Windows)" -ForegroundColor Green
Write-Host ""
Write-Host "Download and install from:" -ForegroundColor Cyan
Write-Host "  https://www.memurai.com/get-memurai" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Choose the option that works best for you!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
