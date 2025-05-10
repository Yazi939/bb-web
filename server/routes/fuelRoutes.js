const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const { protect } = require('../middleware/auth');

// Защищаем все маршруты middleware аутентификации
router.use(protect);

// Проверяем, что контроллеры существуют
if (!fuelController.getFuelTransactions || 
    !fuelController.getFuelTransaction || 
    !fuelController.createFuelTransaction || 
    !fuelController.updateFuelTransaction || 
    !fuelController.deleteFuelTransaction) {
    console.error('Ошибка: не все методы контроллера определены');
    process.exit(1);
}

router.get('/', fuelController.getFuelTransactions);
router.get('/all', fuelController.getAllTransactions);
router.get('/:id', fuelController.getFuelTransaction);
router.post('/', fuelController.createFuelTransaction);
router.put('/:id', fuelController.updateFuelTransaction);
router.delete('/transaction/:id', fuelController.deleteFuelTransaction);

module.exports = router; 