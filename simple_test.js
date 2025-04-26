// Простой тест Electron 
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
 
  const testPath = path.join(__dirname, 'test.html'); 
  mainWindow.loadFile(testPath); 
  mainWindow.webContents.openDevTools(); 
} 
 
app.whenReady().then(function() { 
  createWindow(); 
}); 
 
app.on('window-all-closed', function() { 
  app.quit(); 
}); 
 
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
