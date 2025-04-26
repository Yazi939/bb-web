@echo off
chcp 1251
cls
echo *************************************
echo *   Запуск Electron (отдельно)      *
echo *************************************

cd /d %~dp0

echo Проверка работы серверов...

:: Проверка работы Vite сервера
echo - Проверка Vite сервера (порт 5173)...
curl -s http://localhost:5173 >nul
if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: Vite сервер не запущен или недоступен!
    echo Запустите сначала vite_only.bat
    pause
    exit /b 1
) else (
    echo   Vite сервер работает нормально
)

:: Проверка работы API сервера
echo - Проверка API сервера (порт 5000)...
curl -s http://localhost:5000 >nul
if %ERRORLEVEL% neq 0 (
    echo ПРЕДУПРЕЖДЕНИЕ: API сервер недоступен. Некоторые функции могут не работать.
    echo Если нужен API, запустите api_only.bat в отдельном окне.
    timeout /t 3 /nobreak >nul
) else (
    echo   API сервер работает нормально
)

echo.
echo Запуск Electron приложения...

:: Удаляем старый лог-файл для чистоты
if exist electron_log.txt del /f electron_log.txt

:: Устанавливаем переменные окружения для отладки
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_DISABLE_SANDBOX=1
set NODE_ENV=development

:: Запускаем Electron в отдельном окне
start cmd /k "npm run electron:dev"

echo.
echo Electron запускается в отдельном окне...
echo Если приложение не открылось, проверьте консоль и файл electron_log.txt на наличие ошибок.
echo.

:: Открываем приложение в браузере на всякий случай
echo Открытие приложения в браузере...
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause 