import { ipcMain } from 'electron';

// Обработчики IPC
export const setupIpcHandlers = () => {
    // Синхронизация с сервером
    ipcMain.handle('sync-data', async (_, { dataType, data }) => {
        try {
            const response = await fetch(`http://localhost:3000/api/sync/${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ data })
            });
            return await response.json();
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    });

    ipcMain.handle('get-synced-data', async (_, dataType) => {
        try {
            const response = await fetch(`http://localhost:3000/api/sync/${dataType}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get synced data error:', error);
            throw error;
        }
    });
}; 