const { contextBridge, ipcRenderer } = require('electron');

// Безопасно экспортируем API для использования в рендерере
contextBridge.exposeInMainWorld('electronAPI', {
  // Асинхронный расчет с использованием invoke вместо send/on
  calculateFuel: (data) => ipcRenderer.invoke('calculate-fuel', data),
  
  // Версия приложения
  getAppVersion: () => process.env.npm_package_version || '1.0.0'
});

// Логируем успешную загрузку preload
console.log('Preload script загружен успешно'); 