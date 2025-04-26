# Simple PowerShell script to start the application
Write-Host "Starting Bunker Boats..." -ForegroundColor Cyan

# Start Backend Server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Push-Location -Path "server"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WindowStyle Minimized
Pop-Location

# Wait a bit
Write-Host "Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start React
Write-Host "Starting React application..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -WindowStyle Minimized

# Wait for React to start
Write-Host "Waiting for React to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Electron
Write-Host "Starting Electron..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run electron:dev" -WindowStyle Normal

Write-Host "All components started. This window can be closed." -ForegroundColor Green 