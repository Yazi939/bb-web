const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const https = require('https');
const fs = require('fs');
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

const allowedOrigins = [
  'http://26.10.159.234:3000',
  'http://localhost:3000',
  'http://26.10.159.234:3001',
  'http://localhost:3001',
  'http://89.169.170.164:5000',
  'https://bunker-boats.ru',
  'https://www.bunker-boats.ru'
];

// Настройка CORS
app.use(cors({
    origin: function(origin, callback){
      // разрешаем запросы без origin (например, curl, мобильные приложения)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        const msg = 'CORS policy: Origin not allowed: ' + origin;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Инициализация Socket.IO
socket.init(httpServer);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from the mobile directory
app.use('/mobile', express.static(path.join(__dirname, '../mobile')));

// Serve static files from the dist directory (web build)
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Маршруты
app.use('/api/shifts', shiftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/sync', sync);
app.use('/api/fuel', fuelRoutes);

// Serve mobile app for all other routes
app.get('/mobile/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../mobile/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message
    });
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
    
    // Настройка HTTPS сервера
    const httpsOptions = {
      key: fs.readFileSync('/path/to/your/private.key'),
      cert: fs.readFileSync('/path/to/your/certificate.crt')
    };

    // Запуск HTTPS сервера
    https.createServer(httpsOptions, app).listen(443, '0.0.0.0', () => {
      console.log('HTTPS сервер запущен на порту 443');
    });

    // Запуск HTTP сервера (для редиректа на HTTPS)
    httpServer.listen(80, '0.0.0.0', () => {
      console.log('HTTP сервер запущен на порту 80');
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