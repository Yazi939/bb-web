# Скрипт для запуска приложения через PowerShell
Write-Host "*** Запуск приложения Bunker Boats ***" -ForegroundColor Cyan

# Переходим в каталог с проектом
Set-Location -Path $PSScriptRoot

# Проверка на наличие Node.js
try {
    $nodeVersion = node -v
    Write-Host "Используется Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js не установлен. Пожалуйста, установите Node.js с https://nodejs.org/" -ForegroundColor Red
    Read-Host "Нажмите ENTER для выхода"
    exit
}

# Установка зависимостей главного приложения, если это необходимо
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Установка зависимостей основного приложения..." -ForegroundColor Yellow
    npm install
}

# Установка зависимостей сервера, если это необходимо
if (-not (Test-Path -Path "server/node_modules")) {
    Write-Host "Установка зависимостей сервера..." -ForegroundColor Yellow
    Push-Location -Path "server"
    npm install
    Pop-Location
}

# Запуск сервера в фоновом режиме
Write-Host "Запуск серверной части..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location -Path '$PSScriptRoot\server'; npm run dev; Read-Host 'Сервер остановлен. Нажмите ENTER для выхода'`""

# Ждем, пока сервер запустится
Write-Host "Ожидание запуска сервера (5 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Запуск фронтенда
Write-Host "Запуск клиентской части..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location -Path '$PSScriptRoot'; npm run start; Read-Host 'Клиент остановлен. Нажмите ENTER для выхода'`""

# Ждем, пока фронтенд запустится
Write-Host "Ожидание запуска клиента (5 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Запуск Electron приложения
Write-Host "Запуск приложения Electron..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location -Path '$PSScriptRoot'; npm run electron:dev; Read-Host 'Electron приложение остановлено. Нажмите ENTER для выхода'`""

Write-Host "Все компоненты запущены!" -ForegroundColor Green
Write-Host "Примечание: После закрытия этого окна, приложение продолжит работать в отдельных окнах." -ForegroundColor Yellow 