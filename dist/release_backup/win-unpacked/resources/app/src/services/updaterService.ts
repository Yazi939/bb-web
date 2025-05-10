import { autoUpdater } from 'electron-updater';
import { ipcMain } from 'electron';
import log from 'electron-log';

// Настройка логгера
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Настройка автоматических обновлений
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Функция для инициализации обновлений
export function initUpdater(mainWindow: any) {
  // Проверка наличия обновлений
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', 'checking');
  });

  // Обновление доступно
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  // Обновление недоступно
  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update-not-available', info);
  });

  // Ошибка при проверке обновлений
  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message);
  });

  // Загрузка обновления
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('download-progress', progressObj);
  });

  // Обновление загружено
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });

  // IPC обработчики
  ipcMain.handle('check-for-updates', () => {
    return autoUpdater.checkForUpdates();
  });

  ipcMain.handle('download-update', () => {
    return autoUpdater.downloadUpdate();
  });

  ipcMain.handle('install-update', () => {
    return autoUpdater.quitAndInstall();
  });
} 