// Временный файл для запуска Electron без предупреждений 
const { app, BrowserWindow, ipcMain } = require('electron'); 
const path = require('path'); 
const fs = require('fs'); 
const isDev = !app.isPackaged; 
 
// Отключаем предупреждения о безопасности 
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'; 
 
// Окно приложения 
let mainWindow; 
 
function createWindow() { 
  mainWindow = new BrowserWindow({ 
    width: 1200, 
    height: 800, 
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js'), 
      webSecurity: false, 
    } 
  }); 
 
  // Загружаем приложение из Vite сервера 
  mainWindow.loadURL('http://localhost:5173'); 
 
  // Открываем DevTools 
  mainWindow.webContents.openDevTools(); 
 
  mainWindow.on('closed', function() { 
    mainWindow = null; 
  }); 
} 
 
app.whenReady().then(function() { 
  createWindow(); 
 
  app.on('activate', function() { 
    if (BrowserWindow.getAllWindows().length === 0) createWindow(); 
  }); 
}); 
 
app.on('window-all-closed', function() { 
  if (process.platform !== 'darwin') app.quit(); 
}); 
 
// Обработчики IPC сообщений 
ipcMain.handle('calculate-fuel', function(event, data) { 
  const distance = parseFloat(data.distance); 
  const consumption = parseFloat(data.consumption); 
  const fuelPrice = parseFloat(data.fuelPrice); 
  const fuelNeeded = (distance * consumption) / 100; 
  const cost = fuelNeeded * fuelPrice; 
  return { 
    success: true, 
    fuelNeeded: fuelNeeded.toFixed(2), 
    cost: cost.toFixed(2) 
  }; 
}); 
