# Остановка приложения Bunker Boats
Write-Host "*************************************" -ForegroundColor Cyan
Write-Host "* Остановка приложения Bunker Boats *" -ForegroundColor Cyan
Write-Host "*************************************" -ForegroundColor Cyan

# Устанавливаем текущую директорию
Set-Location -Path $PSScriptRoot

# Останавливаем процессы
Write-Host "Остановка процессов приложения..." -ForegroundColor Yellow
$stoppedCount = 0

try {
    # Останавливаем Electron
    Get-Process -Name electron -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.Id -Force
        Write-Host "  - Остановлен процесс Electron (ID: $($_.Id))" -ForegroundColor Gray
        $stoppedCount++
    }
    
    # Останавливаем Node
    Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
        $processName = $_.CommandLine
        if ($processName -match "server.js" -or $processName -match "vite") {
            Stop-Process -Id $_.Id -Force
            Write-Host "  - Остановлен процесс Node (ID: $($_.Id))" -ForegroundColor Gray
            $stoppedCount++
        }
    }
    
    # Сообщение о результатах
    if ($stoppedCount -gt 0) {
        Write-Host "`nУспешно остановлено $stoppedCount процессов." -ForegroundColor Green
    } else {
        Write-Host "`nНе найдено запущенных процессов приложения." -ForegroundColor Yellow
    }
} catch {
    Write-Host "`nОшибка при остановке процессов: $_" -ForegroundColor Red
} 