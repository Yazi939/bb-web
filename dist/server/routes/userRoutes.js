const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware.protect, authController.getMe);

// Возвращаем маршрут для получения всех пользователей
router.get('/', userController.getAllUsers);

// Новый маршрут для обновления пользователя
router.put('/:id', userController.updateUser);

module.exports = router; 