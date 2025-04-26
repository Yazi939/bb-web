@echo off
chcp 1251
cls
echo *************************************
echo *   Быстрый запуск в режиме разработки   *
echo *************************************

cd /d %~dp0

echo [1/3] Очистка процессов и портов...
echo - Остановка приложения Electron...
taskkill /f /im electron.exe >nul 2>&1

echo - Освобождение порта 5000...
powershell -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo - Освобождение порта 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo - Завершение оставшихся процессов Node.js...
taskkill /f /im node.exe >nul 2>&1

timeout /t 2 /nobreak >nul

echo [2/3] Запуск серверов...
echo - Запуск Vite сервера...
start cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo - Запуск API сервера...
cd server
start cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak >nul

echo [3/3] Запуск Electron с отключенной безопасностью...
if exist electron_log.txt del /f electron_log.txt

:: Настройки режима разработки 
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_DISABLE_SANDBOX=1
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set NODE_ENV=development

echo Запуск Electron...
start cmd /k "npm run electron:dev"

echo.
echo Приложение запущено в режиме разработки
echo.
echo Для остановки всех компонентов закройте окна консоли или запустите stop.bat
echo.
pause 