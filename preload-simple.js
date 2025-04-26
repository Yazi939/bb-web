// Минимальный preload скрипт для разработки и тестирования
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Экспортируем API, которое будет доступно в Renderer процессе
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getAppPath: () => process.cwd(),
  getOsInfo: () => ({
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    userInfo: os.userInfo().username
  }),
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  },
  writeFile: (filePath, data) => {
    try {
      fs.writeFileSync(filePath, data);
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  },
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveMessage: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});

// Для тестирования, добавим глобальную переменную
console.log('Preload script executed - Simple Version');
window.ELECTRON_PRELOAD_LOADED = true; 