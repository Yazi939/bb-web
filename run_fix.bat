@echo off
echo Исправление проблемы "белого экрана" в приложении Bunker Boats

echo 1. Проверка существования папки dist...
if not exist dist (
  echo Папка dist не найдена. Нужна сборка приложения.
  echo Сборка приложения...
  call npm run build
  if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать приложение!
    pause
    exit /b 1
  )
)

echo 2. Создание файла конфигурации...
echo {
echo   "main": "main.js",
echo   "name": "fuel",
echo   "private": true,
echo   "version": "1.0.0",
echo   "dependencies": {}
echo } > dist\package.json

echo 3. Копирование main.js...
copy main.js dist\main.js /Y
copy preload.js dist\preload.js /Y

echo 4. Запуск приложения...
cd dist
electron .

echo.
echo Если приложение запустилось корректно, значит исправление сработало.
echo Вы можете закрыть это окно.
echo.

pause 