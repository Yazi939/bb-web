const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Конфигурация для сервера
const config = {
    port: 5000,
    dbHost: '89.169.170.164',
    dbPath: '/home/ubuntufuel/fuel-app-db/database.sqlite',
    jwtSecret: 'your-secret-key',
    jwtExpire: '30d',
    jwtCookieExpire: 30,
    nodeEnv: 'production'
};

// Создаем директорию для базы данных, если она не существует
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.dbPath,
    host: config.dbHost,
    logging: false
});

// Проверяем подключение к базе данных
sequelize.authenticate()
    .then(() => {
        console.log('SQLite подключена успешно');
    })
    .catch(err => {
        console.error('Ошибка подключения к SQLite:', err);
    });

module.exports = { sequelize, config }; 