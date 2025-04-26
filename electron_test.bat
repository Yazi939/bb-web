@echo off
chcp 1251
cls
echo *************************************
echo *   Запуск Electron с тестовой страницей *
echo *************************************

cd /d %~dp0

echo Убедитесь, что все сервисы остановлены...
call stop.bat >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Создание тестового запуска Electron...

:: Устанавливаем переменные окружения
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_DISABLE_SANDBOX=1
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set NODE_ENV=development

:: Создаем временный файл для запуска
echo // Временный файл для тестового запуска Electron > electron_test_main.js
echo const { app, BrowserWindow, ipcMain } = require('electron'); >> electron_test_main.js
echo const path = require('path'); >> electron_test_main.js
echo const fs = require('fs'); >> electron_test_main.js
echo. >> electron_test_main.js
echo // Окно приложения >> electron_test_main.js
echo let mainWindow; >> electron_test_main.js
echo. >> electron_test_main.js
echo function createWindow() { >> electron_test_main.js
echo   mainWindow = new BrowserWindow({ >> electron_test_main.js
echo     width: 1200, >> electron_test_main.js
echo     height: 800, >> electron_test_main.js
echo     webPreferences: { >> electron_test_main.js
echo       nodeIntegration: false, >> electron_test_main.js
echo       contextIsolation: true, >> electron_test_main.js
echo       preload: path.join(__dirname, 'preload.js'), >> electron_test_main.js
echo       webSecurity: false, >> electron_test_main.js
echo     } >> electron_test_main.js
echo   }); >> electron_test_main.js
echo. >> electron_test_main.js
echo   // Загружаем локальный HTML-файл >> electron_test_main.js
echo   const testPath = path.join(__dirname, 'test.html'); >> electron_test_main.js
echo   console.log('Loading test file from:', testPath); >> electron_test_main.js
echo   mainWindow.loadFile(testPath); >> electron_test_main.js
echo. >> electron_test_main.js
echo   // Открываем DevTools >> electron_test_main.js
echo   mainWindow.webContents.openDevTools(); >> electron_test_main.js
echo. >> electron_test_main.js
echo   mainWindow.on('closed', () => { >> electron_test_main.js
echo     mainWindow = null; >> electron_test_main.js
echo   }); >> electron_test_main.js
echo } >> electron_test_main.js
echo. >> electron_test_main.js
echo app.whenReady().then(() => { >> electron_test_main.js
echo   createWindow(); >> electron_test_main.js
echo. >> electron_test_main.js
echo   app.on('activate', () => { >> electron_test_main.js
echo     if (BrowserWindow.getAllWindows().length === 0) createWindow(); >> electron_test_main.js
echo   }); >> electron_test_main.js
echo }); >> electron_test_main.js
echo. >> electron_test_main.js
echo app.on('window-all-closed', () => { >> electron_test_main.js
echo   if (process.platform !== 'darwin') app.quit(); >> electron_test_main.js
echo }); >> electron_test_main.js
echo. >> electron_test_main.js
echo // Обработчики IPC сообщений >> electron_test_main.js
echo ipcMain.handle('calculate-fuel', (event, data) => { >> electron_test_main.js
echo   const distance = parseFloat(data.distance); >> electron_test_main.js
echo   const consumption = parseFloat(data.consumption); >> electron_test_main.js
echo   const fuelPrice = parseFloat(data.fuelPrice); >> electron_test_main.js
echo   const fuelNeeded = (distance * consumption) / 100; >> electron_test_main.js
echo   const cost = fuelNeeded * fuelPrice; >> electron_test_main.js
echo   return { success: true, fuelNeeded: fuelNeeded.toFixed(2), cost: cost.toFixed(2) }; >> electron_test_main.js
echo }); >> electron_test_main.js

echo.
echo Запуск Electron с тестовой страницей...
start cmd /k "electron electron_test_main.js"

echo.
echo Приложение должно запуститься с тестовой страницей.
echo Проверьте работу preload.js и базовых функций.
echo.
echo ВАЖНО: Этот тест не требует запуска Vite или API серверов.
echo.

pause 