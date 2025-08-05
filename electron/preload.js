contextBridge.exposeInMainWorld('electronAPI', {
  orders: {
    getAll: () => ipcRenderer.invoke('orders:getAll'),
    create: (order) => ipcRenderer.invoke('orders:create', order),
    update: (order) => ipcRenderer.invoke('orders:update', order),
    delete: (id) => ipcRenderer.invoke('orders:delete', id)
  }
}); 