@echo off
echo ** Запуск компонентов Bunker Boats **

echo 1. Запуск API сервера
start "API Server" cmd /c "cd server && npm start"

echo 2. Запуск React сервера
start "React" cmd /c "npm run start"

echo 3. Запуск Electron
timeout /t 5 /nobreak
start "Electron" cmd /c "npm run electron:dev"

echo.
echo Все компоненты запущены. Для остановки закройте окна командной строки.
echo. 