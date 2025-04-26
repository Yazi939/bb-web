@echo off
chcp 1251
cls
echo *************************************
echo *   Electron со статической страницей *
echo *************************************

cd /d %~dp0

echo Остановка процессов...
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

ping -n 3 127.0.0.1 >nul 2>&1

echo.
echo Создание статической HTML страницы...

:: Создаем простую HTML страницу для загрузки
echo ^<!DOCTYPE html^> > static_app.html
echo ^<html lang="ru"^> >> static_app.html
echo ^<head^> >> static_app.html
echo     ^<meta charset="UTF-8"^> >> static_app.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> static_app.html
echo     ^<title^>Fuel Manager (Static)^</title^> >> static_app.html
echo     ^<style^> >> static_app.html
echo         body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; } >> static_app.html
echo         h1 { color: #1890ff; } >> static_app.html
echo         .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; margin: 20px 0; } >> static_app.html
echo         button { background-color: #1890ff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; } >> static_app.html
echo         button:hover { background-color: #40a9ff; } >> static_app.html
echo         input { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; margin: 5px 0; } >> static_app.html
echo         label { display: block; margin-top: 10px; } >> static_app.html
echo     ^</style^> >> static_app.html
echo ^</head^> >> static_app.html
echo ^<body^> >> static_app.html
echo     ^<h1^>Fuel Manager - Статическая версия^</h1^> >> static_app.html
echo     ^<div class="container"^> >> static_app.html
echo         ^<h2^>Калькулятор расхода топлива^</h2^> >> static_app.html
echo         ^<div^> >> static_app.html
echo             ^<label for="distance"^>Расстояние (км):^</label^> >> static_app.html
echo             ^<input type="number" id="distance" value="100"^> >> static_app.html
echo         ^</div^> >> static_app.html
echo         ^<div^> >> static_app.html
echo             ^<label for="consumption"^>Расход (л/100 км):^</label^> >> static_app.html
echo             ^<input type="number" id="consumption" value="10"^> >> static_app.html
echo         ^</div^> >> static_app.html
echo         ^<div^> >> static_app.html
echo             ^<label for="fuelPrice"^>Цена топлива (руб/л):^</label^> >> static_app.html
echo             ^<input type="number" id="fuelPrice" value="50"^> >> static_app.html
echo         ^</div^> >> static_app.html
echo         ^<div style="margin-top: 15px;"^> >> static_app.html
echo             ^<button id="calculate"^>Рассчитать^</button^> >> static_app.html
echo         ^</div^> >> static_app.html
echo         ^<div id="result" style="margin-top: 15px;"^>^</div^> >> static_app.html
echo     ^</div^> >> static_app.html
echo     ^<div class="container"^> >> static_app.html
echo         ^<h2^>Информация^</h2^> >> static_app.html
echo         ^<p^>Версия Electron: ^<span id="version"^>Загрузка...^</span^>^</p^> >> static_app.html
echo         ^<p^>Это статическая версия приложения (без Vite/HMR), которая решает проблему бесконечной перезагрузки.^</p^> >> static_app.html
echo     ^</div^> >> static_app.html
echo     ^<script^> >> static_app.html
echo         // Получаем версию приложения через preload API >> static_app.html
echo         document.addEventListener('DOMContentLoaded', function() { >> static_app.html
echo             try { >> static_app.html
echo                 if (window.electronAPI) { >> static_app.html
echo                     document.getElementById('version').textContent = window.electronAPI.getAppVersion(); >> static_app.html
echo                 } else { >> static_app.html
echo                     document.getElementById('version').textContent = 'Electron API недоступен'; >> static_app.html
echo                 } >> static_app.html
echo             } catch (e) { >> static_app.html
echo                 document.getElementById('version').textContent = 'Ошибка: ' + e.message; >> static_app.html
echo             } >> static_app.html
echo         }); >> static_app.html
echo. >> static_app.html
echo         // Обработка нажатия на кнопку расчета >> static_app.html
echo         document.getElementById('calculate').addEventListener('click', async function() { >> static_app.html
echo             try { >> static_app.html
echo                 const distance = document.getElementById('distance').value; >> static_app.html
echo                 const consumption = document.getElementById('consumption').value; >> static_app.html
echo                 const fuelPrice = document.getElementById('fuelPrice').value; >> static_app.html
echo. >> static_app.html
echo                 if (!window.electronAPI) { >> static_app.html
echo                     document.getElementById('result').innerHTML = 'Electron API недоступен'; >> static_app.html
echo                     return; >> static_app.html
echo                 } >> static_app.html
echo. >> static_app.html
echo                 const result = await window.electronAPI.calculateFuel({ >> static_app.html
echo                     distance, >> static_app.html
echo                     consumption, >> static_app.html
echo                     fuelPrice >> static_app.html
echo                 }); >> static_app.html
echo. >> static_app.html
echo                 if (result.success) { >> static_app.html
echo                     document.getElementById('result').innerHTML = >> static_app.html
echo                         '^<p^>Необходимо топлива: ' + result.fuelNeeded + ' л^</p^>' + >> static_app.html
echo                         '^<p^>Стоимость: ' + result.cost + ' руб^</p^>'; >> static_app.html
echo                 } else { >> static_app.html
echo                     document.getElementById('result').innerHTML = 'Ошибка: ' + result.error; >> static_app.html
echo                 } >> static_app.html
echo             } catch (e) { >> static_app.html
echo                 document.getElementById('result').innerHTML = 'Ошибка: ' + e.message; >> static_app.html
echo             } >> static_app.html
echo         }); >> static_app.html
echo     ^</script^> >> static_app.html
echo ^</body^> >> static_app.html
echo ^</html^> >> static_app.html

echo.
echo Создание скрипта запуска...

:: Создаем JavaScript файл для Electron
echo // Electron с локальной статической страницей > electron_static.js
echo const { app, BrowserWindow, ipcMain } = require('electron'); >> electron_static.js
echo const path = require('path'); >> electron_static.js
echo. >> electron_static.js
echo let mainWindow; >> electron_static.js
echo. >> electron_static.js
echo function createWindow() { >> electron_static.js
echo   mainWindow = new BrowserWindow({ >> electron_static.js
echo     width: 1200, >> electron_static.js
echo     height: 800, >> electron_static.js
echo     webPreferences: { >> electron_static.js
echo       nodeIntegration: false, >> electron_static.js
echo       contextIsolation: true, >> electron_static.js
echo       preload: path.join(__dirname, 'preload.js'), >> electron_static.js
echo       webSecurity: false, >> electron_static.js
echo     } >> electron_static.js
echo   }); >> electron_static.js
echo. >> electron_static.js
echo   // Загружаем статическую страницу >> electron_static.js
echo   const staticPath = path.join(__dirname, 'static_app.html'); >> electron_static.js
echo   console.log('Loading static file from:', staticPath); >> electron_static.js
echo   mainWindow.loadFile(staticPath); >> electron_static.js
echo. >> electron_static.js
echo   // Открываем DevTools >> electron_static.js
echo   mainWindow.webContents.openDevTools(); >> electron_static.js
echo. >> electron_static.js
echo   mainWindow.on('closed', function() { >> electron_static.js
echo     mainWindow = null; >> electron_static.js
echo   }); >> electron_static.js
echo } >> electron_static.js
echo. >> electron_static.js
echo app.whenReady().then(function() { >> electron_static.js
echo   createWindow(); >> electron_static.js
echo }); >> electron_static.js
echo. >> electron_static.js
echo app.on('window-all-closed', function() { >> electron_static.js
echo   app.quit(); >> electron_static.js
echo }); >> electron_static.js
echo. >> electron_static.js
echo // Обработчики IPC сообщений >> electron_static.js
echo ipcMain.handle('calculate-fuel', function(event, data) { >> electron_static.js
echo   const distance = parseFloat(data.distance); >> electron_static.js
echo   const consumption = parseFloat(data.consumption); >> electron_static.js
echo   const fuelPrice = parseFloat(data.fuelPrice); >> electron_static.js
echo   const fuelNeeded = (distance * consumption) / 100; >> electron_static.js
echo   const cost = fuelNeeded * fuelPrice; >> electron_static.js
echo   return { >> electron_static.js
echo     success: true, >> electron_static.js
echo     fuelNeeded: fuelNeeded.toFixed(2), >> electron_static.js
echo     cost: cost.toFixed(2) >> electron_static.js
echo   }; >> electron_static.js
echo }); >> electron_static.js

echo.
echo Запуск Electron со статической страницей...
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
start cmd /k "electron electron_static.js"

echo.
echo Electron запускается со статической HTML страницей без Vite.
echo Это должно устранить проблему бесконечных перезагрузок.
echo.
echo Для остановки закройте окно Electron.
echo.
pause 