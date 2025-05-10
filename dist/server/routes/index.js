const express = require('express');
const router = express.Router();

// Импортируем все маршруты
const shiftRoutes = require('./shiftRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRoutes');
const fuelRoutes = require('./fuelRoutes');
const healthRoutes = require('./healthRoutes');

// Подключаем маршруты
router.use('/shifts', shiftRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/fuel', fuelRoutes);
router.use('/health', healthRoutes);

module.exports = router; 