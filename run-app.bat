@echo off
echo Запуск приложения Fuel Calculator...

echo Проверка установки Node.js и npm...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Node.js не установлен! Пожалуйста, установите Node.js с сайта https://nodejs.org/
  pause
  exit /b 1
)

echo Установка зависимостей...
call npm install

echo Запуск приложения...
start cmd /k npm run dev
timeout /t 5
start cmd /k npm run electron:dev

echo Приложение запущено в двух окнах консоли.
echo Для завершения работы закройте оба окна консоли. 