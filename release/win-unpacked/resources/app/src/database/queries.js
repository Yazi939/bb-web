"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelTransactionQueries = exports.shiftQueries = exports.transactionQueries = void 0;
const db_1 = __importDefault(require("./db"));

console.log('Initializing database queries...');

// Подготавливаем запросы для работы с транзакциями
exports.transactionQueries = {
    insertTransaction: db_1.default.prepare(`
    INSERT INTO transactions (
      id, date, type, fuelType, volume, price, total, notes, createdAt
    ) VALUES (
      @id, @date, @type, @fuelType, @volume, @price, @total, @notes, @createdAt
    )
  `),
    getAllTransactions: db_1.default.prepare(`
    SELECT * FROM transactions
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
  `),
    getTransactionById: db_1.default.prepare('SELECT * FROM transactions WHERE id = ?'),
    updateTransaction: db_1.default.prepare(`
    UPDATE transactions
    SET date = @date, type = @type, fuelType = @fuelType,
        volume = @volume, price = @price, total = @total, notes = @notes
    WHERE id = @id
  `),
    deleteTransaction: db_1.default.prepare('DELETE FROM transactions WHERE id = ?'),
    getTransactionsCount: db_1.default.prepare('SELECT COUNT(*) as count FROM transactions')
};
// Подготавливаем запросы для работы со сменами
exports.shiftQueries = {
    insertShift: db_1.default.prepare(`
    INSERT INTO shifts (
      id, employeeName, date, shiftType, fuelSaved,
      baseSalary, bonus, totalSalary, notes, createdAt
    ) VALUES (
      @id, @employeeName, @date, @shiftType, @fuelSaved,
      @baseSalary, @bonus, @totalSalary, @notes, @createdAt
    )
  `),
    getAllShifts: db_1.default.prepare(`
    SELECT * FROM shifts
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
  `),
    getShiftById: db_1.default.prepare('SELECT * FROM shifts WHERE id = ?'),
    updateShift: db_1.default.prepare(`
    UPDATE shifts
    SET employeeName = @employeeName, date = @date, shiftType = @shiftType,
        fuelSaved = @fuelSaved, baseSalary = @baseSalary, bonus = @bonus,
        totalSalary = @totalSalary, notes = @notes
    WHERE id = @id
  `),
    deleteShift: db_1.default.prepare('DELETE FROM shifts WHERE id = ?'),
    getShiftsCount: db_1.default.prepare('SELECT COUNT(*) as count FROM shifts')
};
// Подготавливаем запросы для работы с транзакциями топлива
exports.fuelTransactionQueries = {
    insertTransaction: db_1.default.prepare(`
    INSERT INTO fuel_transactions (
      id, date, type, fuelType, volume, price, total,
      supplier, customer, vessel, paymentMethod,
      userId, userRole, notes, createdAt
    ) VALUES (
      @id, @date, @type, @fuelType, @volume, @price, @total,
      @supplier, @customer, @vessel, @paymentMethod,
      @userId, @userRole, @notes, @createdAt
    )
  `),
    getAllTransactions: db_1.default.prepare(`
    SELECT * FROM fuel_transactions
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
  `),
    getTransactionById: db_1.default.prepare('SELECT * FROM fuel_transactions WHERE id = ?'),
    updateTransaction: db_1.default.prepare(`
    UPDATE fuel_transactions
    SET date = @date, type = @type, fuelType = @fuelType,
        volume = @volume, price = @price, total = @total,
        supplier = @supplier, customer = @customer, vessel = @vessel,
        paymentMethod = @paymentMethod, notes = @notes,
        userRole = @userRole
    WHERE id = @id
  `),
    deleteTransaction: db_1.default.prepare('DELETE FROM fuel_transactions WHERE id = ?'),
    getTransactionsCount: db_1.default.prepare('SELECT COUNT(*) as count FROM fuel_transactions')
};

console.log('Database queries initialized:', exports.fuelTransactionQueries);
