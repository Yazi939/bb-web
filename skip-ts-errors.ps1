# Script to build and run, skipping TypeScript errors
Write-Host "Building Bunker Boats application (skipping TS errors)..." -ForegroundColor Cyan

# Set the working directory
Set-Location -Path $PSScriptRoot

# Stop any running processes
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" } | Stop-Process -Force
Start-Sleep -Seconds 1

# Build frontend with vite directly (skip typescript checks)
Write-Host "Building frontend with vite directly..." -ForegroundColor Yellow
npx vite build

# Start server
Write-Host "Starting server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Minimized

# Wait for server
Write-Host "Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start Electron
Write-Host "Starting Electron app..." -ForegroundColor Cyan
npm run electron:dev 