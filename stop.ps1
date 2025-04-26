# PowerShell script to stop Bunker Boats application
$border = "=" * 50
Write-Host $border -ForegroundColor Red
Write-Host "         BUNKER BOATS APPLICATION STOPPER         " -ForegroundColor Red
Write-Host $border -ForegroundColor Red
Write-Host ""

Write-Host "Stopping all application processes..." -ForegroundColor Yellow
Write-Host ""

# Stop variables
$electronStopped = 0
$nodeStopped = 0

# Stop Electron
Write-Host "- Stopping Electron processes..." -ForegroundColor Cyan
$electronProcesses = Get-Process electron -ErrorAction SilentlyContinue
if ($electronProcesses) {
    $electronProcesses | ForEach-Object {
        Write-Host "  Stopping Electron process (ID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
        $electronStopped++
    }
    Write-Host "  $electronStopped Electron processes stopped successfully" -ForegroundColor Green
} else {
    Write-Host "  No Electron processes found" -ForegroundColor Gray
}

# Stop Node processes
Write-Host "- Stopping Node processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Stopping Node process (ID: $($_.Id))" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
        $nodeStopped++
    }
    Write-Host "  $nodeStopped Node processes stopped successfully" -ForegroundColor Green
} else {
    Write-Host "  No Node processes found" -ForegroundColor Gray
}

# Total stopped
$totalStopped = $electronStopped + $nodeStopped
Write-Host ""
if ($totalStopped -gt 0) {
    Write-Host "All Bunker Boats processes have been stopped! ($totalStopped total)" -ForegroundColor Green
} else {
    Write-Host "No Bunker Boats processes were found running" -ForegroundColor Yellow
}
Write-Host "" 