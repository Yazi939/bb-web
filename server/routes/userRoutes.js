const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Логирование всех запросов к users API
router.use((req, res, next) => {
  console.log(`👤 Users API: ${req.method} ${req.path} - Body:`, req.body);
  next();
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware.protect, authController.getMe);

// Возвращаем маршрут для получения всех пользователей
router.get('/', userController.getAllUsers);

// Маршрут для создания пользователя (для админки)
router.post('/', userController.createUser);

// Новый маршрут для обновления пользователя
router.put('/:id', userController.updateUser);

// Маршрут для удаления пользователя
router.delete('/:id', userController.deleteUser);

module.exports = router; 