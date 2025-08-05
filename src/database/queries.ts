// Теперь работа с данными только через src/services/api.js

const path = require('path');
const apiPath = path.join(__dirname, 'api');
const { fuelService, shiftService } = require(apiPath);

// Транзакции топлива
export const fuelTransactionQueries = {
  getAllTransactions: (params: any) => fuelService.getTransactions(params),
  getTransactionById: (id: string) => fuelService.getTransaction(id),
  insertTransaction: (data: any) => fuelService.createTransaction(data),
  updateTransaction: (id: string, data: any) => fuelService.updateTransaction(id, data),
  deleteTransaction: (id: string) => fuelService.deleteTransaction(id),
  getTransactionsCount: async (params: any) => {
    const res = await fuelService.getTransactions(params);
    return res.data.length;
  }
};

// Смены
export const shiftQueries = {
  getAllShifts: (params: any) => shiftService.getShifts(params),
  getShiftById: (id: string) => shiftService.getShift(id),
  insertShift: (data: any) => shiftService.createShift(data),
  updateShift: (id: string, data: any) => shiftService.updateShift(id, data),
  deleteShift: (id: string) => shiftService.deleteShift(id),
  getShiftsCount: async (params: any) => {
    const res = await shiftService.getShifts(params);
    return res.data.length;
  }
}; 