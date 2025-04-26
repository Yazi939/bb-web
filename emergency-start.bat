@echo off
echo *** BUNKER BOATS - ЭКСТРЕННЫЙ ЗАПУСК ***
echo.

REM Остановить все процессы
echo Остановка всех процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo Все процессы остановлены.
echo.

REM Копировать файлы с безопасными версиями
echo Настройка безопасного запуска...
copy /Y main-simple.js main-emergency.js >nul
copy /Y index-static.html index-emergency.html >nul
echo Файлы подготовлены.
echo.

REM Запуск сервера независимо
echo Запуск сервера (подождите 10 секунд)...
start "Backend Server" cmd /c "cd server && npm start"
ping 127.0.0.1 -n 11 >nul
echo Сервер запущен.
echo.

REM Запуск React независимо
echo Запуск React (подождите 15 секунд)...
start "React" cmd /c "npm run start"
ping 127.0.0.1 -n 16 >nul
echo React запущен.
echo.

REM Запуск Electron с нашим упрощенным main.js
echo Запуск Electron с экстренной конфигурацией...
start "Electron" cmd /c "electron main-emergency.js"
echo.

echo ================================================
echo Все компоненты запущены!
echo.
echo Если приложение не запустится, проверьте:
echo 1. На порту 3000 запущен React
echo 2. На порту 5000 запущен сервер
echo.
echo Нажмите любую клавишу, чтобы закрыть это окно.
echo ================================================
pause >nul 