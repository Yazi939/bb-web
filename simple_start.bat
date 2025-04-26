@echo off
chcp 1251
cls
echo *************************************
echo *   Простой запуск приложения      *
echo *************************************

cd /d %~dp0

echo Остановка процессов...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

ping -n 3 127.0.0.1 >nul 2>&1

echo.
echo Запуск Vite сервера...
start cmd /k "npm run dev"

ping -n 3 127.0.0.1 >nul 2>&1

echo Запуск API сервера...
cd server
start cmd /k "npm run dev"
cd ..

ping -n 3 127.0.0.1 >nul 2>&1

echo Запуск Electron...
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
start cmd /k "npm run electron:dev"

echo.
echo Все компоненты запущены.
echo Для закрытия приложения закройте все консольные окна или используйте stop.bat
echo.
pause 