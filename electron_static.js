// Electron с локальной статической страницей 
const { app, BrowserWindow, ipcMain } = require('electron'); 
const path = require('path'); 
 
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
 
  // Загружаем статическую страницу 
  const staticPath = path.join(__dirname, 'static_app.html'); 
  console.log('Loading static file from:', staticPath); 
  mainWindow.loadFile(staticPath); 
 
  // Открываем DevTools 
  mainWindow.webContents.openDevTools(); 
 
  mainWindow.on('closed', function() { 
    mainWindow = null; 
  }); 
} 
 
app.whenReady().then(function() { 
  createWindow(); 
}); 
 
app.on('window-all-closed', function() { 
  app.quit(); 
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
