const { Shift } = require('../models');

// Получить все смены
const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll();
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Добавить смену
const addShift = async (req, res) => {
  try {
    const { fuelSaved, fuelPrice, shiftType } = req.body;
    
    // Рассчитываем базовую зарплату
    const baseSalary = shiftType === 'day' ? 5500 : 6500;
    
    // Новый расчёт бонуса
    const bonus = fuelSaved * fuelPrice;
    
    // Рассчитываем общую зарплату
    const totalSalary = baseSalary + bonus;
    
    const shift = await Shift.create({
      ...req.body,
      baseSalary,
      bonus,
      totalSalary
    });
    
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить смену
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { fuelSaved, fuelPrice, shiftType } = req.body;
    
    // Рассчитываем базовую зарплату
    const baseSalary = shiftType === 'day' ? 5500 : 6500;
    
    // Новый расчёт бонуса
    const bonus = fuelSaved * fuelPrice;
    
    // Рассчитываем общую зарплату
    const totalSalary = baseSalary + bonus;
    
    const [updated] = await Shift.update({
      ...req.body,
      baseSalary,
      bonus,
      totalSalary
    }, { where: { id } });
    
    if (updated) {
      const updatedShift = await Shift.findByPk(id);
      res.json(updatedShift);
    } else {
      res.status(404).json({ error: 'Shift not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить смену
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Shift.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Shift not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllShifts,
  addShift,
  updateShift,
  deleteShift
}; 