# Script to restart the Bunker Boats application
Write-Host "*** Restarting Bunker Boats application ***" -ForegroundColor Cyan

# Set the working directory
Set-Location -Path $PSScriptRoot

# Check for and stop existing processes
Write-Host "Stopping any running processes..." -ForegroundColor Yellow

# Stop electron processes if running
try {
    Get-Process electron -ErrorAction SilentlyContinue | ForEach-Object { 
        Write-Host "Stopping Electron process with ID $($_.Id)" -ForegroundColor Yellow
        $_ | Stop-Process -Force 
    }
} catch {
    Write-Host "No Electron processes found" -ForegroundColor Gray
}

# Stop node processes related to our server
try {
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*vite*"
    } | ForEach-Object { 
        Write-Host "Stopping Node process with ID $($_.Id)" -ForegroundColor Yellow
        $_ | Stop-Process -Force 
    }
} catch {
    Write-Host "No Node server processes found" -ForegroundColor Gray
}

# Wait a moment for processes to terminate
Write-Host "Waiting for processes to terminate..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Start the backend server
Write-Host "Starting the backend server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Minimized

# Wait for the server to start
Write-Host "Waiting for server startup (3 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start the Vite development server
Write-Host "Starting Vite development server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Minimized

# Wait for Vite to start
Write-Host "Waiting for Vite server startup (8 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Start the Electron app
Write-Host "Starting Electron application..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run electron:dev" -WindowStyle Normal

Write-Host "Application has been restarted!" -ForegroundColor Green
Write-Host "Check electron_log.txt for detailed logs if you encounter issues." -ForegroundColor Yellow 