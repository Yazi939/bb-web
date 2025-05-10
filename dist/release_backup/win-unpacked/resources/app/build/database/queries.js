"use strict";
// Теперь работа с данными только через src/services/api.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftQueries = exports.fuelTransactionQueries = void 0;
const path = require('path');
const apiPath = path.join(__dirname, 'api');
const { fuelService, shiftService } = require(apiPath);
// Транзакции топлива
exports.fuelTransactionQueries = {
    getAllTransactions: (params) => fuelService.getTransactions(params),
    getTransactionById: (id) => fuelService.getTransaction(id),
    insertTransaction: (data) => fuelService.createTransaction(data),
    updateTransaction: (id, data) => fuelService.updateTransaction(id, data),
    deleteTransaction: (id) => fuelService.deleteTransaction(id),
    getTransactionsCount: async (params) => {
        const res = await fuelService.getTransactions(params);
        return res.data.length;
    }
};
// Смены
exports.shiftQueries = {
    getAllShifts: (params) => shiftService.getShifts(params),
    getShiftById: (id) => shiftService.getShift(id),
    insertShift: (data) => shiftService.createShift(data),
    updateShift: (id, data) => shiftService.updateShift(id, data),
    deleteShift: (id) => shiftService.deleteShift(id),
    getShiftsCount: async (params) => {
        const res = await shiftService.getShifts(params);
        return res.data.length;
    }
};
