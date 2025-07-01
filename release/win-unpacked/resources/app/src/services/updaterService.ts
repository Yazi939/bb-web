import { autoUpdater } from 'electron-updater';
import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';

// Настройка логгера
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Настройка автоматических обновлений
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Регистрация IPC обработчиков
export function registerUpdaterHandlers() {
  log.info('=== Начало регистрации обработчиков обновлений ===');
  
  try {
    // IPC обработчики
    ipcMain.handle('check-for-updates', () => {
      log.info('Обработчик check-for-updates вызван');
      return autoUpdater.checkForUpdates();
    });

    ipcMain.handle('download-update', () => {
      log.info('Обработчик download-update вызван');
      return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('install-update', () => {
      log.info('Обработчик install-update вызван');
      return autoUpdater.quitAndInstall();
    });

    log.info('=== Обработчики обновлений успешно зарегистрированы ===');
  } catch (error) {
    log.error('Ошибка при регистрации обработчиков обновлений:', error);
    throw error;
  }
}

// Функция для инициализации обновлений
export function initUpdater(mainWindow: BrowserWindow) {
  log.info('=== Начало инициализации системы обновлений ===');
  log.info('MainWindow существует:', !!mainWindow);
  log.info('MainWindow webContents существует:', !!mainWindow?.webContents);

  try {
    // Проверка наличия обновлений
    autoUpdater.on('checking-for-update', () => {
      log.info('Событие: checking-for-update');
      mainWindow.webContents.send('update-status', 'checking');
    });

    // Обновление доступно
    autoUpdater.on('update-available', (info) => {
      log.info('Событие: update-available', info);
      mainWindow.webContents.send('update-available', info);
    });

    // Обновление недоступно
    autoUpdater.on('update-not-available', (info) => {
      log.info('Событие: update-not-available', info);
      mainWindow.webContents.send('update-not-available', info);
    });

    // Ошибка при проверке обновлений
    autoUpdater.on('error', (err) => {
      log.error('Событие: error', err);
      mainWindow.webContents.send('update-error', err.message);
    });

    // Загрузка обновления
    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Событие: download-progress', progressObj);
      mainWindow.webContents.send('download-progress', progressObj);
    });

    // Обновление загружено
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Событие: update-downloaded', info);
      mainWindow.webContents.send('update-downloaded', info);
    });

    log.info('=== События обновлений успешно зарегистрированы ===');

    // Проверяем наличие обновлений при запуске
    log.info('Запуск проверки обновлений...');
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Ошибка при проверке обновлений:', err);
    });

    log.info('=== Инициализация системы обновлений завершена ===');
  } catch (error) {
    log.error('Ошибка при инициализации системы обновлений:', error);
    throw error;
  }
} 