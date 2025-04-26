@echo off
chcp 1251
cls
echo *************************************
echo *   Запуск Electron без предупреждений *
echo *************************************

cd /d %~dp0

echo Проверка работы серверов...

:: Проверка работы Vite сервера
echo - Проверка Vite сервера (порт 5173)...
curl -s http://localhost:5173 >nul
if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: Vite сервер не запущен или недоступен!
    echo Запустите сначала vite_only.bat
    pause
    exit /b 1
) else (
    echo   Vite сервер работает нормально
)

:: Проверка работы API сервера
echo - Проверка API сервера (порт 5000)...
curl -s http://localhost:5000 >nul
if %ERRORLEVEL% neq 0 (
    echo ПРЕДУПРЕЖДЕНИЕ: API сервер недоступен. Некоторые функции могут не работать.
    echo Если нужен API, запустите api_only.bat в отдельном окне.
    ping -n 3 127.0.0.1 >nul 2>&1
) else (
    echo   API сервер работает нормально
)

echo.
echo Запуск Electron приложения с отключенными предупреждениями...

:: Удаляем старый лог-файл для чистоты
if exist electron_log.txt del /f electron_log.txt

:: Устанавливаем переменные окружения
set DEBUG=electron*
set ELECTRON_ENABLE_LOGGING=true
set ELECTRON_DISABLE_SANDBOX=1
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set ELECTRON_ENABLE_INSECURE_CONTENT=1
set ELECTRON_ALLOW_FILE_SYSTEM_ACCESS=1
set NODE_ENV=development

:: Создаем временный файл main_override.js
echo // Временный файл для запуска Electron без предупреждений > main_override.js
echo const { app, BrowserWindow, ipcMain } = require('electron'); >> main_override.js
echo const path = require('path'); >> main_override.js
echo const fs = require('fs'); >> main_override.js
echo const isDev = !app.isPackaged; >> main_override.js
echo. >> main_override.js
echo // Отключаем предупреждения о безопасности >> main_override.js
echo process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'; >> main_override.js
echo. >> main_override.js
echo // Окно приложения >> main_override.js
echo let mainWindow; >> main_override.js
echo. >> main_override.js
echo function createWindow() { >> main_override.js
echo   mainWindow = new BrowserWindow({ >> main_override.js
echo     width: 1200, >> main_override.js
echo     height: 800, >> main_override.js
echo     webPreferences: { >> main_override.js
echo       nodeIntegration: false, >> main_override.js
echo       contextIsolation: true, >> main_override.js
echo       preload: path.join(__dirname, 'preload.js'), >> main_override.js
echo       webSecurity: false, >> main_override.js
echo     } >> main_override.js
echo   }); >> main_override.js
echo. >> main_override.js
echo   // Загружаем приложение из Vite сервера >> main_override.js
echo   mainWindow.loadURL('http://localhost:5173'); >> main_override.js
echo. >> main_override.js
echo   // Открываем DevTools >> main_override.js
echo   mainWindow.webContents.openDevTools(); >> main_override.js
echo. >> main_override.js
echo   mainWindow.on('closed', function() { >> main_override.js
echo     mainWindow = null; >> main_override.js
echo   }); >> main_override.js
echo } >> main_override.js
echo. >> main_override.js
echo app.whenReady().then(function() { >> main_override.js
echo   createWindow(); >> main_override.js
echo. >> main_override.js
echo   app.on('activate', function() { >> main_override.js
echo     if (BrowserWindow.getAllWindows().length === 0) createWindow(); >> main_override.js
echo   }); >> main_override.js
echo }); >> main_override.js
echo. >> main_override.js
echo app.on('window-all-closed', function() { >> main_override.js
echo   if (process.platform !== 'darwin') app.quit(); >> main_override.js
echo }); >> main_override.js
echo. >> main_override.js
echo // Обработчики IPC сообщений >> main_override.js
echo ipcMain.handle('calculate-fuel', function(event, data) { >> main_override.js
echo   const distance = parseFloat(data.distance); >> main_override.js
echo   const consumption = parseFloat(data.consumption); >> main_override.js
echo   const fuelPrice = parseFloat(data.fuelPrice); >> main_override.js
echo   const fuelNeeded = (distance * consumption) / 100; >> main_override.js
echo   const cost = fuelNeeded * fuelPrice; >> main_override.js
echo   return { >> main_override.js
echo     success: true, >> main_override.js
echo     fuelNeeded: fuelNeeded.toFixed(2), >> main_override.js
echo     cost: cost.toFixed(2) >> main_override.js
echo   }; >> main_override.js
echo }); >> main_override.js

:: Запускаем Electron с временным файлом
echo Запуск Electron с отключенными проверками безопасности...
start cmd /k "electron main_override.js"

echo.
echo Electron запускается в отдельном окне без предупреждений безопасности...
echo.
echo ВАЖНО: Этот режим использует упрощенную версию main.js с отключенными проверками безопасности.
echo Используйте его только для разработки.
echo.

pause 