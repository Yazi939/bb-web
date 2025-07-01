const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const config = require('../config/database');
const sqlite3 = require('sqlite3').verbose();

// Подключение к базе данных
const db = new sqlite3.Database(config.database);

// GET /api/expenses - Получить все расходы
router.get('/', auth, (req, res) => {
  const query = `
    SELECT * FROM Expenses 
    WHERE status = 'active' 
    ORDER BY date DESC, createdAt DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      return res.status(500).json({ error: 'Ошибка получения расходов' });
    }
    res.json(rows);
  });
});

// GET /api/expenses/:id - Получить конкретный расход
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT * FROM Expenses WHERE id = ?';
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching expense:', err);
      return res.status(500).json({ error: 'Ошибка получения расхода' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Расход не найден' });
    }
    
    res.json(row);
  });
});

// POST /api/expenses - Создать новый расход
router.post('/', auth, (req, res) => {
  const {
    type,
    category, 
    description,
    amount,
    date,
    paymentMethod = 'cash',
    supplier,
    invoice,
    notes,
    userId,
    createdBy
  } = req.body;

  // Валидация обязательных полей
  if (!type || !category || !description || !amount || !date || !userId) {
    return res.status(400).json({ 
      error: 'Обязательные поля: type, category, description, amount, date, userId' 
    });
  }

  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  const now = new Date().toISOString();

  const query = `
    INSERT INTO Expenses (
      id, type, category, description, amount, date, paymentMethod,
      supplier, invoice, notes, userId, createdBy, timestamp, status,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id, type, category, description, amount, date, paymentMethod,
    supplier, invoice, notes, userId, createdBy, timestamp, 'active',
    now, now
  ];

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error creating expense:', err);
      return res.status(500).json({ error: 'Ошибка создания расхода' });
    }

    // Возвращаем созданный расход
    db.get('SELECT * FROM Expenses WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching created expense:', err);
        return res.status(500).json({ error: 'Ошибка получения созданного расхода' });
      }
      res.status(201).json(row);
    });
  });
});

// PUT /api/expenses/:id - Обновить расход
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
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

  // Сначала проверим, существует ли расход
  db.get('SELECT * FROM Expenses WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking expense:', err);
      return res.status(500).json({ error: 'Ошибка проверки расхода' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Расход не найден' });
    }

    const now = new Date().toISOString();
    
    const query = `
      UPDATE Expenses SET 
        type = ?, category = ?, description = ?, amount = ?, date = ?,
        paymentMethod = ?, supplier = ?, invoice = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `;

    const params = [
      type || row.type,
      category || row.category,
      description || row.description,
      amount !== undefined ? amount : row.amount,
      date || row.date,
      paymentMethod || row.paymentMethod,
      supplier !== undefined ? supplier : row.supplier,
      invoice !== undefined ? invoice : row.invoice,
      notes !== undefined ? notes : row.notes,
      now,
      id
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating expense:', err);
        return res.status(500).json({ error: 'Ошибка обновления расхода' });
      }

      // Возвращаем обновленный расход
      db.get('SELECT * FROM Expenses WHERE id = ?', [id], (err, updatedRow) => {
        if (err) {
          console.error('Error fetching updated expense:', err);
          return res.status(500).json({ error: 'Ошибка получения обновленного расхода' });
        }
        res.json(updatedRow);
      });
    });
  });
});

// DELETE /api/expenses/:id - Удалить расход (мягкое удаление)
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;

  // Проверим, существует ли расход
  db.get('SELECT * FROM Expenses WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking expense:', err);
      return res.status(500).json({ error: 'Ошибка проверки расхода' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Расход не найден' });
    }

    const now = new Date().toISOString();
    
    // Мягкое удаление - меняем статус на cancelled
    const query = 'UPDATE Expenses SET status = ?, updatedAt = ? WHERE id = ?';
    
    db.run(query, ['cancelled', now, id], function(err) {
      if (err) {
        console.error('Error deleting expense:', err);
        return res.status(500).json({ error: 'Ошибка удаления расхода' });
      }

      res.json({ message: 'Расход успешно удален', id });
    });
  });
});

// GET /api/expenses/stats/summary - Получить статистику расходов
router.get('/stats/summary', auth, (req, res) => {
  const queries = {
    total: "SELECT SUM(amount) as total FROM Expenses WHERE status = 'active'",
    count: "SELECT COUNT(*) as count FROM Expenses WHERE status = 'active'",
    byType: "SELECT type, SUM(amount) as total FROM Expenses WHERE status = 'active' GROUP BY type",
    byCategory: "SELECT category, SUM(amount) as total FROM Expenses WHERE status = 'active' GROUP BY category"
  };

  const results = {};

  // Выполняем все запросы параллельно
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.total, [], (err, row) => {
        if (err) reject(err);
        else resolve({ total: row.total || 0 });
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.count, [], (err, row) => {
        if (err) reject(err);
        else resolve({ count: row.count || 0 });
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries.byType, [], (err, rows) => {
        if (err) reject(err);
        else resolve({ byType: rows });
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries.byCategory, [], (err, rows) => {
        if (err) reject(err);
        else resolve({ byCategory: rows });
      });
    })
  ])
  .then(([totalResult, countResult, typeResult, categoryResult]) => {
    res.json({
      ...totalResult,
      ...countResult,
      ...typeResult,
      ...categoryResult
    });
  })
  .catch(err => {
    console.error('Error fetching expense stats:', err);
    res.status(500).json({ error: 'Ошибка получения статистики расходов' });
  });
});

module.exports = router; 