@echo off
chcp 1251
cls
echo *************************************
echo * Запуск приложения Bunker Boats *
echo *************************************

cd %~dp0

echo [1/3] Остановка предыдущих процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Запуск серверов...
start /min cmd /c "cd server && npm run dev"
echo     - Backend сервер запущен
timeout /t 3 /nobreak >nul

start /min cmd /c "npm run dev"
echo     - Vite сервер запущен
timeout /t 7 /nobreak >nul

echo [3/3] Запуск Electron приложения...
start cmd /c "npm run electron:dev"

echo.
echo Готово! Приложение запущено.
echo  - Серверная часть: http://localhost:5000
echo  - Клиентская часть: http://localhost:5173
echo  - Для остановки приложения закройте все окна
echo.
pause 