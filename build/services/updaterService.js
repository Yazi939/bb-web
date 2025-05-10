"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUpdater = initUpdater;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
// Настройка логгера
electron_log_1.default.transports.file.level = 'info';
electron_updater_1.autoUpdater.logger = electron_log_1.default;
// Настройка автоматических обновлений
electron_updater_1.autoUpdater.autoDownload = false;
electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
// Функция для инициализации обновлений
function initUpdater(mainWindow) {
    console.log('Initializing updater...');
    // Проверка наличия обновлений
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...');
        mainWindow.webContents.send('update-status', 'checking');
    });
    // Обновление доступно
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info);
        mainWindow.webContents.send('update-available', info);
    });
    // Обновление недоступно
    electron_updater_1.autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available:', info);
        mainWindow.webContents.send('update-not-available', info);
    });
    // Ошибка при проверке обновлений
    electron_updater_1.autoUpdater.on('error', (err) => {
        console.error('Update error:', err);
        mainWindow.webContents.send('update-error', err.message);
    });
    // Загрузка обновления
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        console.log('Download progress:', progressObj);
        mainWindow.webContents.send('download-progress', progressObj);
    });
    // Обновление загружено
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info);
        mainWindow.webContents.send('update-downloaded', info);
    });
    // Проверяем наличие обновлений при запуске
    console.log('Checking for updates on startup...');
    electron_updater_1.autoUpdater.checkForUpdates().catch(err => {
        console.error('Error checking for updates:', err);
    });
    // IPC обработчики
    electron_1.ipcMain.handle('check-for-updates', () => {
        return electron_updater_1.autoUpdater.checkForUpdates();
    });
    electron_1.ipcMain.handle('download-update', () => {
        return electron_updater_1.autoUpdater.downloadUpdate();
    });
    electron_1.ipcMain.handle('install-update', () => {
        return electron_updater_1.autoUpdater.quitAndInstall();
    });
}
