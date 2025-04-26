@echo off
chcp 1251
cls
echo *************************************
echo *   Поэтапный запуск приложения     *
echo *************************************

cd /d %~dp0

echo Очистка процессов и портов...
echo - Остановка приложения Electron...
taskkill /f /im electron.exe >nul 2>&1

echo - Освобождение порта 5000...
powershell -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo - Освобождение порта 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo - Завершение оставшихся процессов Node.js...
taskkill /f /im node.exe >nul 2>&1

timeout /t 3 /nobreak >nul

echo.
echo *************************************
echo *   ШАГ 1: Запуск Vite сервера      *
echo *************************************
echo.
echo Запуск Vite сервера на порту 5173...
start cmd /k npm run dev

echo.
echo Ожидание запуска Vite (15 секунд)...
timeout /t 15 /nobreak >nul

:: Проверка, что Vite запустился
echo Проверка доступности Vite...
curl -s http://localhost:5173 >nul
if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: Vite сервер не запустился! Дополнительное ожидание...
    timeout /t 10 /nobreak >nul
    
    :: Повторная проверка
    curl -s http://localhost:5173 >nul
    if %ERRORLEVEL% neq 0 (
        echo ОШИБКА: Vite сервер не запустился! Прекращение запуска.
        pause
        exit /b 1
    )
)
echo Vite сервер успешно запущен.

echo.
echo *************************************
echo *   ШАГ 2: Запуск API сервера       *
echo *************************************
echo.
echo Запуск API сервера на порту 5000...
cd server
start cmd /k npm run dev
cd ..
timeout /t 5 /nobreak >nul

:: Проверка API сервера
curl -s http://localhost:5000 >nul
if %ERRORLEVEL% neq 0 (
    echo ПРЕДУПРЕЖДЕНИЕ: API сервер не доступен. Продолжаем без него.
) else (
    echo API сервер успешно запущен.
)

echo.
echo *************************************
echo *   ШАГ 3: Запуск Electron          *
echo *************************************
echo.
echo Удаление старого лог-файла...
if exist electron_log.txt del /f electron_log.txt

:: Устанавливаем переменные окружения для отладки
echo Установка переменных окружения для отладки...
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_DISABLE_SANDBOX=1
set NODE_ENV=development

echo Запуск Electron...
start cmd /k npm run electron:dev

echo.
echo Открытие приложения в браузере...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo *************************************
echo *   Приложение запущено!            *
echo *************************************
echo.
echo Запущены следующие компоненты:
echo - Vite сервер (порт 5173) - для отображения интерфейса
echo - API сервер (порт 5000) - для обработки данных
echo - Electron - для десктопной версии приложения
echo.
echo Если возникнут проблемы, проверьте логи в соответствующих окнах.
echo.
echo Для остановки всех компонентов запустите stop.bat
echo.
pause 