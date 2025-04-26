@echo off
echo Starting Bunker Boats...
cd /d "%~dp0"

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Запускаем Vite и Electron
echo Starting Vite server...
start /B cmd /c "npm run dev"

REM Ждем 5 секунд используя Node.js
node wait.js

echo Starting Electron...
start /B cmd /c "npm run electron:dev"

echo Application started!
echo If you see a white screen, please wait a few seconds for the application to load.
echo Check electron_log.txt for more information if needed.

pause