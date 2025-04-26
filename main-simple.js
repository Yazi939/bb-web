const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Проверяем, запущен ли режим разработки
const isDev = process.env.NODE_ENV === 'development';
console.log(`Running in ${isDev ? 'development' : 'production'} mode`);

// Сохраняем глобальную ссылку на окно, чтобы предотвратить его удаление сборщиком мусора
let mainWindow;

// Создание главного окна приложения
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload-simple.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // В режиме разработки загружаем локальный HTML-файл
  // В режиме production можно загрузить URL React-приложения
  mainWindow.loadFile(path.join(__dirname, 'static-no-redirect.html'));

  // Открываем DevTools в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Обработка закрытия окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('Main window created');
}

// Создаем окно когда Electron готов
app.whenReady().then(() => {
  createWindow();

  // На macOS пересоздаем окно при клике на иконку (если нет активных окон)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Завершаем приложение, когда все окна закрыты (кроме macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработчики IPC (Inter-Process Communication)
ipcMain.on('app-info-request', (event) => {
  event.reply('app-info-response', {
    appName: app.getName(),
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch
  });
});

// Вывод информации о старте приложения
console.log(`Electron application starting - ${new Date().toISOString()}`);
console.log(`App path: ${app.getAppPath()}`);
console.log(`User data path: ${app.getPath('userData')}`); 