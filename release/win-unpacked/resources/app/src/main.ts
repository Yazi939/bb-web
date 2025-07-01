import { app, BrowserWindow, ipcMain } from 'electron';
import { initUpdater, registerUpdaterHandlers } from './services/updaterService';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import electronLog from 'electron-log';

const isDev = false;
const baseDir = isDev ? __dirname : path.join(process.resourcesPath, 'app');

// Функция для логирования
function logMessage(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  electronLog.info(logMessage);
}

// Проверка порта
async function checkPort(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.status === 200;
  } catch {
    return false;
  }
}

// Поиск порта Vite
async function findVitePort(): Promise<number | null> {
  logMessage('Поиск сервера Vite...');
  for (let port = 5173; port <= 5183; port++) {
    logMessage(`Проверка порта ${port}...`);
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      logMessage(`Найден сервер на порту ${port}`);
      return port;
    }
  }
  return null;
}

// Проверка сервера Vite
async function checkViteServer(): Promise<number> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    logMessage(`Попытка ${attempts} найти сервер...`);
    
    const port = await findVitePort();
    if (port) {
      return port;
    }
    
    // Ждем 1 секунду перед следующей попыткой
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Не удалось найти сервер Vite');
}

let mainWindow: BrowserWindow | null = null;

// Регистрируем IPC обработчики до создания окна
function registerIpcHandlers() {
  logMessage('=== Начало регистрации всех IPC обработчиков ===');
  try {
    // Регистрируем обработчики обновлений
    registerUpdaterHandlers();
    logMessage('=== Регистрация всех IPC обработчиков завершена ===');
  } catch (error) {
    logMessage('Ошибка при регистрации IPC обработчиков:');
    electronLog.error(error);
    throw error;
  }
}

async function createWindow() {
  logMessage('=== Начало создания главного окна ===');
  
  const preloadPath = path.join(__dirname, 'preload.cjs');
  logMessage(`Путь к preload скрипту: ${preloadPath}`);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    }
  });

  // Проверяем существование preload скрипта
  if (!require('fs').existsSync(preloadPath)) {
    logMessage('Preload script not found at:');
    electronLog.error(preloadPath);
  } else {
    logMessage('Preload script found at:');
    electronLog.info(preloadPath);
  }

  logMessage('Главное окно создано');
  
  if (process.env.NODE_ENV === 'development') {
    // В режиме разработки загружаем localhost
    logMessage('Ожидание сервера Vite...');
    try {
      const port = await checkViteServer();
      const url = `http://localhost:${port}/index.html`;
      logMessage(`Загрузка приложения с ${url}`);
      await mainWindow.loadURL(url);
    } catch (error) {
      logMessage('Ошибка при загрузке URL:');
      electronLog.error(error);
      throw error;
    }
  } else {
    // В продакшене загружаем собранное приложение
    const indexPath = path.join(baseDir, 'index.html');
    logMessage(`Загрузка приложения из ${indexPath}`);
    await mainWindow.loadFile(indexPath);
  }

  // Инициализируем систему обновлений
  logMessage('=== Начало инициализации системы обновлений ===');
  initUpdater(mainWindow);
  logMessage('=== Инициализация системы обновлений завершена ===');

  mainWindow.on('closed', () => {
    logMessage('Главное окно закрыто');
    mainWindow = null;
  });
}

// Логируем запуск приложения
logMessage('=== Запуск приложения ===');

// Обработка ошибок
process.on('uncaughtException', (error) => {
  logMessage('Необработанное исключение:');
  electronLog.error(error);
});

process.on('unhandledRejection', (error) => {
  logMessage('Необработанное отклонение промиса:');
  electronLog.error(error);
});

// Запуск приложения
app.whenReady().then(() => {
  logMessage('=== Приложение готово ===');
  // Регистрируем обработчики перед созданием окна
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 