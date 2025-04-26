@echo off
echo *************************************
echo * Запуск приложения Bunker Boats *
echo *************************************

cd %~dp0

echo [1/3] Остановка предыдущих процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/3] Запуск сервера и разработочного сервера...
start cmd /c "cd server && npm run dev"
ping 127.0.0.1 -n 3 >nul

start cmd /c "npm run dev"
ping 127.0.0.1 -n 7 >nul

echo [3/3] Запуск Electron приложения...
start cmd /c "npm run electron:dev"

echo Готово! Приложение запущено.
echo  - Серверная часть: http://localhost:5000
echo  - Клиентская часть: http://localhost:5173
echo  - Закройте это окно, когда закончите работу с приложением
echo.
echo После закрытия этого окна приложение продолжит работать.
echo.
pause 