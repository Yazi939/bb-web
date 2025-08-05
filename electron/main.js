mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});

// Set CSP header
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self';" +
        "connect-src 'self' http://localhost:* ws://localhost:* ws://89.169.170.164:*;" +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
        "style-src 'self' 'unsafe-inline';" +
        "img-src 'self' data:;"
      ]
    }
  });
});

// Orders handlers
ipcMain.handle('orders:getAll', async () => {
  try {
    const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
});

ipcMain.handle('orders:create', async (_, order) => {
  try {
    const result = await db.run(
      'INSERT INTO orders (type, volume, price, totalCost, date, timestamp, fuelType, customer, vessel, paymentMethod, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order.type, order.volume, order.price, order.totalCost, order.date, order.timestamp, order.fuelType, order.customer, order.vessel, order.paymentMethod, order.notes]
    );
    return { id: result.lastID, ...order };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
});

ipcMain.handle('orders:update', async (_, order) => {
  try {
    await db.run(
      'UPDATE orders SET type = ?, volume = ?, price = ?, totalCost = ?, date = ?, timestamp = ?, fuelType = ?, customer = ?, vessel = ?, paymentMethod = ?, notes = ? WHERE id = ?',
      [order.type, order.volume, order.price, order.totalCost, order.date, order.timestamp, order.fuelType, order.customer, order.vessel, order.paymentMethod, order.notes, order.id]
    );
    return order;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
});

ipcMain.handle('orders:delete', async (_, id) => {
  try {
    await db.run('DELETE FROM orders WHERE id = ?', [id]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}); 