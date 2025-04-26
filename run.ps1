# PowerShell script to start Bunker Boats application
$border = "=" * 50
Write-Host $border -ForegroundColor Cyan
Write-Host "         BUNKER BOATS APPLICATION STARTER         " -ForegroundColor Cyan
Write-Host $border -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill processes
Write-Host "[1/3] Stopping existing processes..." -ForegroundColor Yellow

# Stop Electron
$electronProcesses = Get-Process electron -ErrorAction SilentlyContinue
if ($electronProcesses) {
    $electronProcesses | ForEach-Object {
        Write-Host "  Stopping Electron process (ID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
}

# Stop Node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Stopping Node process (ID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
}

Write-Host "  Done!" -ForegroundColor Green
Write-Host ""

# Step 2: Start services
Write-Host "[2/3] Starting application components..." -ForegroundColor Yellow

# Start backend server
Write-Host "  - Starting backend server..." -ForegroundColor Gray
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Minimized

# Start Vite dev server
Write-Host "  - Starting Vite development server..." -ForegroundColor Gray
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Minimized

# Start Electron
Write-Host "  - Starting Electron application..." -ForegroundColor Gray
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run electron:dev" -WindowStyle Normal

Write-Host "  Done!" -ForegroundColor Green
Write-Host ""

# Step 3: Summary
Write-Host "[3/3] Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host " Running services:" -ForegroundColor Cyan
Write-Host " - Backend API: http://localhost:5000" -ForegroundColor White
Write-Host " - Frontend Dev: http://localhost:5173" -ForegroundColor White
Write-Host " - Electron App: Connected to frontend" -ForegroundColor White
Write-Host ""
Write-Host " To stop all services, run .\stop.ps1 or close all opened windows" -ForegroundColor Yellow 