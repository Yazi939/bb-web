@echo off
echo Stopping all processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo Preparing files...
copy static-no-redirect.html index.html >nul 2>&1
copy preload-simple.js preload-temp.js >nul 2>&1

echo Creating minimal main.js...
echo const { app, BrowserWindow } = require('electron'); > main-simple.js
echo const path = require('path'); >> main-simple.js
echo. >> main-simple.js
echo function createWindow() { >> main-simple.js
echo   const win = new BrowserWindow({ >> main-simple.js
echo     width: 1200, >> main-simple.js
echo     height: 800, >> main-simple.js
echo     webPreferences: { >> main-simple.js
echo       nodeIntegration: true, >> main-simple.js
echo       contextIsolation: false, >> main-simple.js
echo       preload: path.join(__dirname, 'preload-temp.js') >> main-simple.js
echo     } >> main-simple.js
echo   }); >> main-simple.js
echo   win.loadFile('index.html'); >> main-simple.js
echo   win.webContents.openDevTools(); >> main-simple.js
echo } >> main-simple.js
echo. >> main-simple.js
echo app.whenReady().then(() => { >> main-simple.js
echo   createWindow(); >> main-simple.js
echo }); >> main-simple.js

echo Starting backend server...
start cmd /k "cd server && npm start"

echo Starting React application...
start cmd /k "cd client && npm start"

echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo Starting Electron with static HTML...
start cmd /k "npx electron main-simple.js"

echo.
echo Если приложение не запустилось правильно:
echo 1. Проверьте статус серверов в окне Electron
echo 2. Если статус "Online", нажмите "Redirect to React"
echo 3. Если проблема остается, проверьте консоль разработчика (F12) 