const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

// Единственный экземпляр приложения
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

// Окно приложения
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Не показываем окно до полной загрузки
    backgroundColor: '#f0f2f5' // Задаем цвет фона для предотвращения белого экрана
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Загружаем HTML
  const startUrl = isDev 
    ? 'http://localhost:5173' // Адрес Vite dev сервера
    : `file://${path.join(__dirname, './dist/index.html')}`;

  mainWindow.loadURL(startUrl)
    .catch(err => {
      console.error('Ошибка при загрузке URL:', err);
      // Пробуем альтернативный путь
      try {
        mainWindow.loadFile(path.join(__dirname, './dist/index.html'));
      } catch (err2) {
        console.error('Критическая ошибка при загрузке файла:', err2);
        fs.writeFileSync('error_log.txt', `${new Date().toISOString()} - Ошибка загрузки: ${err2.message}\n${err2.stack}`, 
          { flag: 'a' });
      }
    });

  // DevTools только в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Создаем окно после запуска приложения
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Реагируем на попытку запуска второго экземпляра
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Закрываем приложение, когда все окна закрыты (кроме macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Обработчики IPC сообщений
ipcMain.handle('calculate-fuel', (event, data) => {
  try {
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
  } catch (error) {
    console.error('Ошибка при расчете:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Добавляем логирование ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  fs.writeFileSync('error_log.txt', `${new Date().toISOString()} - Ошибка: ${error.message}\n${error.stack}`, 
    { flag: 'a' });
}); 