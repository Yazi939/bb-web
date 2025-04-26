import { ipcMain } from 'electron';
import { vehicleOperations, transactionOperations } from '../database/db';

// Обработчики для транспортных средств
ipcMain.handle('vehicles:getAll', async () => {
  try {
    return vehicleOperations.getAllVehicles();
  } catch (error) {
    console.error('Error in vehicles:getAll:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:add', async (_, vehicle) => {
  try {
    return vehicleOperations.addVehicle(vehicle);
  } catch (error) {
    console.error('Error in vehicles:add:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:update', async (_, vehicle) => {
  try {
    return vehicleOperations.updateVehicle(vehicle);
  } catch (error) {
    console.error('Error in vehicles:update:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:delete', async (_, id) => {
  try {
    return vehicleOperations.deleteVehicle(id);
  } catch (error) {
    console.error('Error in vehicles:delete:', error);
    throw error;
  }
});

// Обработчики для транзакций
ipcMain.handle('transactions:getAll', async () => {
  try {
    return transactionOperations.getAllTransactions();
  } catch (error) {
    console.error('Error in transactions:getAll:', error);
    throw error;
  }
});

ipcMain.handle('transactions:add', async (_, transaction) => {
  try {
    return transactionOperations.addTransaction(transaction);
  } catch (error) {
    console.error('Error in transactions:add:', error);
    throw error;
  }
});

ipcMain.handle('transactions:getByDateRange', async (_, startDate, endDate) => {
  try {
    return transactionOperations.getTransactionsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('Error in transactions:getByDateRange:', error);
    throw error;
  }
});

ipcMain.handle('transactions:getByFuelType', async (_, fuelType) => {
  try {
    return transactionOperations.getTransactionsByFuelType(fuelType);
  } catch (error) {
    console.error('Error in transactions:getByFuelType:', error);
    throw error;
  }
}); 