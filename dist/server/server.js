const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { sequelize, config } = require('./config/database');
const cookieParser = require('cookie-parser');
const socket = require('./socket');

// Импорт маршрутов
const userRoutes = require('./routes/userRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const orderRoutes = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const sync = require('./routes/sync');
const fuelRoutes = require('./routes/fuelRoutes');

const app = express();
const httpServer = createServer(app);

// Настройка CORS
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:3000', 'http://localhost:5173', 'http://89.169.170.164:*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Инициализация Socket.IO
socket.init(httpServer);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Маршруты
app.use('/api/shifts', shiftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/sync', sync);
app.use('/api/fuel', fuelRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Инициализация базы данных
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite подключена успешно');
    
    // Синхронизация моделей с базой данных
    await sequelize.sync();
    console.log('Модели синхронизированы с базой данных');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
};

// Инициализация приложения
const initApp = async () => {
  try {
    await initializeDatabase();
    
    // Запуск сервера
    httpServer.listen(config.port, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${config.port}`);
    });
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    process.exit(1);
  }
};

// Запускаем приложение только если файл запущен напрямую
if (require.main === module) {
  initApp();
}

// Обработка необработанных ошибок
process.on('uncaughtException', (err) => {
  console.error('Необработанная ошибка:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный rejection:', reason);
});

// Экспортируем только необходимые компоненты
module.exports = {
  app,
  httpServer,
  config
}; 