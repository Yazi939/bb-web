# Запуск приложения Bunker Boats
Write-Host "*************************************" -ForegroundColor Cyan
Write-Host "* Запуск приложения Bunker Boats *" -ForegroundColor Cyan
Write-Host "*************************************" -ForegroundColor Cyan

# Установка текущей директории
Set-Location -Path $PSScriptRoot

# Останавливаем предыдущие процессы
Write-Host "[1/3] Остановка предыдущих процессов..." -ForegroundColor Yellow
try {
    # Останавливаем Electron
    Get-Process -Name electron -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.Id -Force
        Write-Host "  - Остановлен процесс Electron (ID: $($_.Id))" -ForegroundColor Gray
    }
    
    # Останавливаем Node
    Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
        $processName = $_.CommandLine
        if ($processName -match "server.js" -or $processName -match "vite") {
            Stop-Process -Id $_.Id -Force
            Write-Host "  - Остановлен процесс Node (ID: $($_.Id))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Ошибка при остановке процессов: $_" -ForegroundColor Red
}

# Небольшая пауза
Start-Sleep -Seconds 2

# Запускаем серверную часть
Write-Host "[2/3] Запуск серверов..." -ForegroundColor Yellow
Write-Host "  - Запуск backend сервера..." -ForegroundColor Gray
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 3

Write-Host "  - Запуск Vite сервера разработки..." -ForegroundColor Gray
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 7

# Запуск Electron
Write-Host "[3/3] Запуск Electron приложения..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run electron:dev" -WindowStyle Normal

# Информационное сообщение
Write-Host "`nГотово! Приложение запущено." -ForegroundColor Green
Write-Host " - Серверная часть: http://localhost:5000" -ForegroundColor Cyan
Write-Host " - Клиентская часть: http://localhost:5173" -ForegroundColor Cyan
Write-Host " - Electron будет автоматически подключаться к приложению" -ForegroundColor Cyan
Write-Host "`nЧтобы остановить все процессы, запустите 'stop-app.ps1' или закройте все окна вручную." -ForegroundColor Yellow 