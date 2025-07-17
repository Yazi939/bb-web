const express = require('express');
const router = express.Router();
const { Expense, User } = require('../models');
const auth = require('../middleware/auth');

// GET /api/expenses - Получить все расходы
router.get('/', auth.protect, async (req, res) => {
  try {
    const { type, category, startDate, endDate, status } = req.query;

    const whereClause = {};

    // Фильтрация по типу
    if (type) {
      whereClause.type = type;
    }

    // Фильтрация по категории
    if (category) {
      whereClause.category = category;
    }

    // Фильтрация по статусу
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'active'; // По умолчанию показываем только активные
    }

    // Фильтрация по датам
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [require('sequelize').Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [require('sequelize').Op.lte]: endDate
      };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Ошибка при получении расходов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении расходов',
      details: error.message
    });
  }
});

// GET /api/expenses/:id - Получить расход по ID
router.get('/:id', auth.protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Расход не найден'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Ошибка при получении расхода:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении расхода',
      details: error.message
    });
  }
});

// POST /api/expenses - Создать новый расход
router.post('/', auth.protect, async (req, res) => {
  try {
    const {
      type,
      category,
      description,
      amount,
      date,
      paymentMethod,
      supplier,
      invoice,
      notes
    } = req.body;

    // Валидация обязательных полей
    if (!type || !category || !description || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: type, category, description, amount'
      });
    }

    const expenseData = {
      type,
      category,
      description,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'cash',
      supplier,
      invoice,
      notes,
      userId: req.user.id,
      createdBy: req.user.username || req.user.name,
      status: 'active'
    };

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Расход успешно создан'
    });
  } catch (error) {
    console.error('Ошибка при создании расхода:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании расхода',
      details: error.message
    });
  }
});

// PUT /api/expenses/:id - Обновить расход
router.put('/:id', auth.protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Расход не найден'
      });
    }

    // Проверяем права доступа (только создатель или админ может редактировать)
    if (expense.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав для редактирования этого расхода'
      });
    }

    const {
      type,
      category,
      description,
      amount,
      date,
      paymentMethod,
      supplier,
      invoice,
      notes,
      status
    } = req.body;

    const updateData = {};

    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = date;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (invoice !== undefined) updateData.invoice = invoice;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && req.user.role === 'admin') updateData.status = status;

    await expense.update(updateData);

    res.json({
      success: true,
      data: expense,
      message: 'Расход успешно обновлен'
    });
  } catch (error) {
    console.error('Ошибка при обновлении расхода:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении расхода',
      details: error.message
    });
  }
});

// DELETE /api/expenses/:id - Удалить расход
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Расход не найден'
      });
    }

    // Проверяем права доступа (только создатель или админ может удалять)
    if (expense.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав для удаления этого расхода'
      });
    }

    // Мягкое удаление - меняем статус на cancelled
    await expense.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Расход успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении расхода:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении расхода',
      details: error.message
    });
  }
});

// GET /api/expenses/stats/summary - Получить статистику расходов
router.get('/stats/summary', auth.protect, async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const whereClause = { status: 'active' };

    // Фильтрация по датам
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../config/database');

    // Общая статистика
    const totalStats = await sequelize.query(`
      SELECT
        type,
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as minimum,
        MAX(amount) as maximum
      FROM Expenses
      WHERE status = 'active'
      ${startDate && endDate ? `AND date BETWEEN '${startDate}' AND '${endDate}'` : ''}
      GROUP BY ${groupBy === 'category' ? 'category' : 'type'}
      ORDER BY total DESC
    `, { type: QueryTypes.SELECT });

    // Статистика по месяцам
    const monthlyStats = await sequelize.query(`
      SELECT
        strftime('%Y-%m', date) as month,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM Expenses
      WHERE status = 'active'
      ${startDate && endDate ? `AND date BETWEEN '${startDate}' AND '${endDate}'` : ''}
      GROUP BY month, type
      ORDER BY month DESC, total DESC
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        summary: totalStats,
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики',
      details: error.message
    });
  }
});

module.exports = router; 