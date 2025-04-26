# Скрипт запуска приложения Bunker Boats
Write-Host "*** Запуск приложения Bunker Boats ***" -ForegroundColor Cyan

# Установка рабочей директории
Set-Location -Path $PSScriptRoot

# Остановка предыдущих процессов
Write-Host "Остановка предыдущих процессов приложения..." -ForegroundColor Yellow
try {
    Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -match "server.js" 
    } | Stop-Process -Force
} catch {
    Write-Host "Не удалось остановить некоторые процессы: $_" -ForegroundColor Gray
}

# Запуск сервера
Write-Host "Запуск сервера..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Minimized

# Ожидание запуска сервера
Write-Host "Ожидание запуска сервера (3 секунды)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Запуск Electron приложения
Write-Host "Запуск приложения..." -ForegroundColor Cyan
npm run electron:dev 