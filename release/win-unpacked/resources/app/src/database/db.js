"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
// Путь к файлу базы данных
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'fuel-app.db');
// Создаем экземпляр базы данных
const db = new sqlite3_1.default.Database(dbPath);
// Создаем таблицы, если они не существуют
function initializeDatabase() {
    // Таблица для транзакций топлива
    db.run(`
    CREATE TABLE IF NOT EXISTS fuel_transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      fuelType TEXT NOT NULL,
      volume REAL NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      supplier TEXT,
      customer TEXT,
      vessel TEXT,
      paymentMethod TEXT,
      userId TEXT,
      userRole TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL
    )
  `);
    // Таблица для смен
    db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      employeeName TEXT NOT NULL,
      date TEXT NOT NULL,
      shiftType TEXT NOT NULL,
      fuelSaved REAL NOT NULL,
      baseSalary REAL NOT NULL,
      bonus REAL NOT NULL,
      totalSalary REAL NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL
    )
  `);
    // Создаем индексы для оптимизации поиска
    db.run(`
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(date);
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_type ON fuel_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_fuelType ON fuel_transactions(fuelType);
    CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
    CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employeeName);
  `);
}
// Инициализируем базу данных
initializeDatabase();
exports.default = db;
