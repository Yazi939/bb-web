const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const queriesPath = path.join(__dirname, 'build', 'database', 'queries.js');
const { transactionQueries, shiftQueries, fuelTransactionQueries } = require(queriesPath);
const { Server } = require('socket.io');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Создаем HTTP сервер
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5174', 'http://localhost:3000', 'http://localhost:5173', 'http://89.169.170.164:*', 'ws://89.169.170.164:*'],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Запускаем сервер на порту 5000
server.listen(5000, '0.0.0.0', () => {
  console.log('WebSocket сервер запущен на порту 5000');
});

// Получаем путь к директории приложения
const appPath = app.getAppPath();

// Настройка IPC handlers
function setupIPC() {
  // Транзакции
  ipcMain.handle('transactions:getAll', async (event, params = {}) => {
    try {
      console.log('Getting all transactions with params:', params);
      let transactions = [];
      let count = 0;
      
      if (fuelTransactionQueries.getAllTransactions && fuelTransactionQueries.getAllTransactions.all) {
        console.log('Executing getAllTransactions query...');
        try {
          transactions = fuelTransactionQueries.getAllTransactions.all({ limit: 1000000, offset: 0 }) || [];
          console.log('Query result:', transactions);
        } catch (queryError) {
          console.error('Error executing getAllTransactions query:', queryError);
        }
      } else {
        console.error('fuelTransactionQueries.getAllTransactions is not available');
      }
      
      if (fuelTransactionQueries.getTransactionsCount && fuelTransactionQueries.getTransactionsCount.get) {
        try {
          const result = fuelTransactionQueries.getTransactionsCount.get() || { count: 0 };
          count = result.count || 0;
          console.log('Total transactions count:', count);
        } catch (countError) {
          console.error('Error getting transactions count:', countError);
        }
      } else {
        console.error('fuelTransactionQueries.getTransactionsCount is not available');
      }
      
      return { transactions, total: count };
    } catch (error) {
      console.error('Error in transactions:getAll:', error);
      return { transactions: [], total: 0 };
    }
  });

  ipcMain.handle('transactions:add', async (event, transaction) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await fuelTransactionQueries.insertTransaction({ ...transaction, id, createdAt });
    return { ...transaction, id, createdAt };
  });

  ipcMain.handle('transactions:update', async (event, transaction) => {
    fuelTransactionQueries.updateTransaction.run(transaction);
    return transaction;
  });

  ipcMain.handle('transactions:delete', async (event, id) => {
    fuelTransactionQueries.deleteTransaction(id);
    return true;
  });

  // Транспортные средства
  ipcMain.handle('vehicles-get-all', async () => {
    return store.get('vehicles', []);
  });

  ipcMain.handle('vehicles-add', async (_, vehicle) => {
    const vehicles = store.get('vehicles', []);
    const newVehicle = {
      ...vehicle,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString()
    };
    vehicles.push(newVehicle);
    store.set('vehicles', vehicles);
    return vehicles;
  });

  ipcMain.handle('vehicles-update', async (_, vehicle) => {
    const vehicles = store.get('vehicles', []);
    const index = vehicles.findIndex(v => v.id === vehicle.id);
    if (index !== -1) {
      vehicles[index] = {
        ...vehicles[index],
        ...vehicle,
        updatedAt: new Date().toISOString()
      };
      store.set('vehicles', vehicles);
    }
    return vehicles;
  });

  ipcMain.handle('vehicles-delete', async (_, id) => {
    const vehicles = store.get('vehicles', []);
    const filteredVehicles = vehicles.filter(v => v.id !== id);
    store.set('vehicles', filteredVehicles);
    return filteredVehicles;
  });

  // Данные
  ipcMain.handle('data:get', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('data:set', (_, { key, value }) => {
    store.set(key, value);
    return true;
  });

  // Синхронизация
  ipcMain.handle('sync:getData', async (_, dataType) => {
    return store.get(dataType);
  });

  ipcMain.handle('sync:setData', async (_, { dataType, data }) => {
    store.set(dataType, data);
    return true;
  });

  // Обработчики для смен
  ipcMain.handle('shifts:getAll', async (event, { page = 1, pageSize = 10 }) => {
    const offset = (page - 1) * pageSize;
    const shifts = shiftQueries.getAllShifts.all({ limit: pageSize, offset });
    const { count } = shiftQueries.getShiftsCount.get();
    return { shifts, total: count };
  });

  ipcMain.handle('shifts:add', async (event, shift) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    shiftQueries.insertShift.run({ ...shift, id, createdAt });
    return { ...shift, id, createdAt };
  });

  ipcMain.handle('shifts:update', async (event, shift) => {
    shiftQueries.updateShift.run(shift);
    return shift;
  });

  ipcMain.handle('shifts:delete', async (event, id) => {
    shiftQueries.deleteShift.run(id);
    return true;
  });

  // Добавляем обработчик app:ready
  ipcMain.handle('app:ready', () => {
    console.log('App is ready');
    return true;
  });

  // Обработчики для заказов
  ipcMain.handle('orders:getAll', async (event, { page = 1, pageSize = 10 }) => {
    const offset = (page - 1) * pageSize;
    const orders = store.get('orders', []);
    return { orders, total: orders.length };
  });

  ipcMain.handle('orders:add', async (event, order) => {
    const orders = store.get('orders', []);
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    store.set('orders', orders);
    return newOrder;
  });

  ipcMain.handle('orders:update', async (event, order) => {
    const orders = store.get('orders', []);
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      store.set('orders', orders);
    }
    return order;
  });

  ipcMain.handle('orders:delete', async (event, id) => {
    const orders = store.get('orders', []);
    const filteredOrders = orders.filter(o => o.id !== id);
    store.set('orders', filteredOrders);
    return true;
  });

  // Обработчики для WebSocket событий
  io.on('connection', (socket) => {
    console.log('Клиент подключен');

    socket.on('disconnect', () => {
      console.log('Клиент отключен');
    });

    // Отправляем обновления при изменении данных
    ipcMain.on('data-updated', (event, data) => {
      io.emit('data-updated', data);
    });
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(appPath, 'preload.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Устанавливаем CSP при создании окна
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* http://89.169.170.164:* ws://89.169.170.164:*;",
          "connect-src 'self' http://localhost:* ws://localhost:* http://89.169.170.164:* ws://89.169.170.164:* ws://89.169.170.164:5000 http://89.169.170.164:5000;",
          "img-src 'self' data: https:;",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
          "style-src 'self' 'unsafe-inline';"
        ].join(' ')
      }
    });
  });

  // Загрузка приложения
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // Используем file:// протокол для загрузки локальных файлов
    mainWindow.loadFile(path.join(appPath, 'dist', 'index.html'));
  }

  // Обработка ошибок загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load URL:', errorCode, errorDescription);
    if (isDev) {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5174');
      }, 5000);
    }
  });
}

// Инициализация приложения
app.whenReady().then(async () => {
  setupIPC();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 