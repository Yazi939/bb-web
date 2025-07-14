// Заглушка для Electron API в веб-версии
export const ipcRenderer = {
  invoke: async (channel: string, ...args: any[]) => {
    console.warn(`Electron IPC call ignored in web version: ${channel}`, args);
    return Promise.resolve(null);
  },
  
  on: (channel: string, listener: (...args: any[]) => void) => {
    console.warn(`Electron IPC listener ignored in web version: ${channel}`);
    return {
      removeListener: () => {}
    };
  },

  send: (channel: string, ...args: any[]) => {
    console.warn(`Electron IPC send ignored in web version: ${channel}`, args);
  }
};

export const shell = {
  openExternal: (url: string) => {
    window.open(url, '_blank');
  }
};

export const app = {
  getVersion: () => '2.1.13-web',
  getName: () => 'Bunker Boats Web',
  getPath: (name: string) => '/tmp'
};

export const dialog = {
  showMessageBox: async (options: any) => {
    console.warn('Dialog ignored in web version:', options);
    return Promise.resolve({ response: 0, checkboxChecked: false });
  },
  
  showOpenDialog: async (options: any) => {
    console.warn('File dialog ignored in web version:', options);
    return Promise.resolve({ canceled: true, filePaths: [] });
  }
};

export const autoUpdater = {
  checkForUpdatesAndNotify: () => {
    console.warn('Auto updater not available in web version');
  },
  
  on: (event: string, listener: Function) => {
    console.warn(`Auto updater event ignored in web version: ${event}`);
  }
};

// Default export для совместимости
export default {
  ipcRenderer,
  shell,
  app,
  dialog,
  autoUpdater
}; 