@echo off
chcp 1251
cls
echo *************************************
echo *   Запуск API сервера (отдельно)  *
echo *************************************

cd /d %~dp0

echo Освобождение порта 5000...
powershell -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul

echo Проверка доступности порта...
powershell -Command "if ((Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).Count -gt 0) { Write-Host 'ОШИБКА: Порт 5000 занят другим процессом!'; exit 1 }"
if %ERRORLEVEL% neq 0 (
    echo Не удалось освободить порт 5000. Проверьте запущенные процессы.
    pause
    exit /b 1
)

echo Запуск API сервера на порту 5000...
echo.

:: Перейти в папку server и запустить
cd server
start cmd /k "npm start"

cd ..
echo.
echo API сервер запущен. Сервер работает на порту 5000.
echo Терминал с сервером останется открытым для отображения логов.
echo.

timeout /t 5 /nobreak >nul

:: Проверка, что API запустился
curl -s http://localhost:5000 >nul
if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: API сервер не запустился! Проверьте логи в окне запуска.
) else (
    echo API сервер успешно запущен и доступен.
)

echo Для тестирования доступности API: http://localhost:5000
echo.
cd ..
pause 