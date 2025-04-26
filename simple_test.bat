@echo off
chcp 1251
cls
echo *************************************
echo *   Простой тест Electron          *
echo *************************************

cd /d %~dp0

echo Создание тестового файла...

echo // Простой тест Electron > simple_test.js
echo const { app, BrowserWindow, ipcMain } = require('electron'); >> simple_test.js
echo const path = require('path'); >> simple_test.js
echo. >> simple_test.js
echo let mainWindow; >> simple_test.js
echo. >> simple_test.js
echo function createWindow() { >> simple_test.js
echo   mainWindow = new BrowserWindow({ >> simple_test.js
echo     width: 1200, >> simple_test.js
echo     height: 800, >> simple_test.js
echo     webPreferences: { >> simple_test.js
echo       nodeIntegration: false, >> simple_test.js
echo       contextIsolation: true, >> simple_test.js
echo       preload: path.join(__dirname, 'preload.js'), >> simple_test.js
echo       webSecurity: false, >> simple_test.js
echo     } >> simple_test.js
echo   }); >> simple_test.js
echo. >> simple_test.js
echo   const testPath = path.join(__dirname, 'test.html'); >> simple_test.js
echo   mainWindow.loadFile(testPath); >> simple_test.js
echo   mainWindow.webContents.openDevTools(); >> simple_test.js
echo } >> simple_test.js
echo. >> simple_test.js
echo app.whenReady().then(function() { >> simple_test.js
echo   createWindow(); >> simple_test.js
echo }); >> simple_test.js
echo. >> simple_test.js
echo app.on('window-all-closed', function() { >> simple_test.js
echo   app.quit(); >> simple_test.js
echo }); >> simple_test.js
echo. >> simple_test.js
echo ipcMain.handle('calculate-fuel', function(event, data) { >> simple_test.js
echo   const distance = parseFloat(data.distance); >> simple_test.js
echo   const consumption = parseFloat(data.consumption); >> simple_test.js
echo   const fuelPrice = parseFloat(data.fuelPrice); >> simple_test.js
echo   const fuelNeeded = (distance * consumption) / 100; >> simple_test.js
echo   const cost = fuelNeeded * fuelPrice; >> simple_test.js
echo   return { >> simple_test.js
echo     success: true, >> simple_test.js
echo     fuelNeeded: fuelNeeded.toFixed(2), >> simple_test.js
echo     cost: cost.toFixed(2) >> simple_test.js
echo   }; >> simple_test.js
echo }); >> simple_test.js

echo Запуск Electron...
start cmd /k "electron simple_test.js"

echo.
echo Electron запускается с тестовой страницей.
echo Для остановки закройте окно Electron.
echo.
pause 