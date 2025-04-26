@echo off
chcp 1251
cls
echo *************************************
echo * Запуск в браузере (без Electron) *
echo *************************************

cd %~dp0

echo [1/3] Очистка процессов...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Освобождение портов...
echo - Освобождение порта 5000...
FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":5000"') DO (
    taskkill /F /PID %%a >nul 2>&1
)

echo - Освобождение порта 5173...
FOR /F "tokens=5" %%a IN ('netstat -ano ^| findstr ":5173"') DO (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [3/3] Запуск серверов...

:: Запуск API сервера
cd server
start cmd /k npm run dev
cd ..
echo - Запущен API сервер (порт 5000)
timeout /t 5 /nobreak >nul

:: Запуск Vite сервера
start cmd /k npm run start
echo - Запущен Vite сервер (порт 5173)
timeout /t 8 /nobreak >nul

:: Открытие в браузере
echo - Открытие приложения в браузере...
start http://localhost:5173

echo.
echo Приложение запущено в браузере!
echo.
echo Для остановки закройте консоли или выполните stop.bat
echo. 