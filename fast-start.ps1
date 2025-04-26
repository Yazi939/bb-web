# Запуск приложения Bunker Boats
Write-Host ""
Write-Host "**************************************" -ForegroundColor Cyan
Write-Host "*                                    *" -ForegroundColor Cyan
Write-Host "*      BUNKER BOATS STARTUP          *" -ForegroundColor Cyan
Write-Host "*                                    *" -ForegroundColor Cyan
Write-Host "**************************************" -ForegroundColor Cyan
Write-Host ""

# Переходим в корневую директорию
Set-Location -Path $PSScriptRoot

# Убиваем существующие процессы
Write-Host "[1/4] Останавливаем существующие процессы..." -ForegroundColor Yellow
Get-Process -Name electron -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   Готово!" -ForegroundColor Green
Write-Host ""

# Запускаем бэкенд
Write-Host "[2/4] Запускаем сервер бэкэнда..." -ForegroundColor Yellow
Set-Location -Path "server"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WindowStyle Minimized
Set-Location -Path $PSScriptRoot
Write-Host "   Сервер бэкэнда запущен" -ForegroundColor Green
Write-Host ""

# Ждем и показываем прогресс
Write-Host "[3/4] Запускаем React сервер..." -ForegroundColor Yellow
Write-Host "   Ожидаем запуск сервера (10 секунд)" -ForegroundColor Gray
$totalSeconds = 10
for ($i = 0; $i -lt $totalSeconds; $i++) {
    $percent = ($i / $totalSeconds) * 100
    Write-Progress -Activity "Ожидание запуска сервера" -Status "$percent% Complete:" -PercentComplete $percent
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Ожидание запуска сервера" -Completed
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -WindowStyle Minimized
Write-Host "   React сервер запущен" -ForegroundColor Green
Write-Host ""

# Запускаем Electron
Write-Host "[4/4] Запускаем Electron приложение..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run electron:dev" -WindowStyle Normal
Write-Host "   Electron приложение запущено" -ForegroundColor Green
Write-Host ""

Write-Host "Все компоненты запущены!" -ForegroundColor Cyan
Write-Host ""
Write-Host "* Для остановки приложения:" -ForegroundColor White
Write-Host "  - Закройте все командные окна" -ForegroundColor White
Write-Host "  - Или нажмите любую клавишу для выхода" -ForegroundColor White
Write-Host ""

# Ждем нажатия клавиши
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Завершаем все процессы
Write-Host "Останавливаем все процессы..." -ForegroundColor Yellow
Get-Process -Name electron -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Готово! Все процессы остановлены." -ForegroundColor Green
Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 