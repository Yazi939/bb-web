const asyncHandler = require('express-async-handler');
const socket = require('../socket');
const Base = require('../models/Base');

class BaseController {
  constructor(model) {
    this.model = model;
  }

  // Получить все записи
  getAll = asyncHandler(async (req, res) => {
    const items = await this.model.findAll();
    res.status(200).json(items);
  });

  // Получить одну запись по ID
  getOne = asyncHandler(async (req, res) => {
    const item = await this.model.findByPk(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Запись не найдена');
    }
    res.status(200).json(item);
  });

  // Создать новую запись
  create = asyncHandler(async (req, res) => {
    const item = await this.model.create(req.body);
    
    // Отправляем уведомления через Socket.IO
    const io = socket.getIO();
    io.emit('transaction:created', item);
    io.emit('data-updated', { 
      type: 'transactions',
      action: 'created',
      data: item
    });
    console.log(`Отправлено событие создания транзакции ${item.id}`);
    
    res.status(201).json(item);
  });

  // Обновить запись
  update = asyncHandler(async (req, res) => {
    const item = await this.model.findByPk(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Запись не найдена');
    }
    
    await item.update(req.body);
    
    // Отправляем уведомления через Socket.IO
    const io = socket.getIO();
    io.emit('transaction:updated', item);
    io.emit('data-updated', { 
      type: 'transactions',
      action: 'updated',
      data: item
    });
    console.log(`Отправлено событие обновления транзакции ${item.id}`);
    
    res.status(200).json(item);
  });

  // Удалить запись
  delete = asyncHandler(async (req, res) => {
    const item = await this.model.findByPk(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Запись не найдена');
    }
    
    await item.destroy();
    
    // Отправляем уведомления через Socket.IO
    const io = socket.getIO();
    io.emit('transaction:deleted', req.params.id);
    io.emit('data-updated', { 
      type: 'transactions',
      action: 'deleted',
      id: req.params.id
    });
    console.log(`Отправлено событие удаления транзакции ${req.params.id}`);
    
    res.status(200).json({ id: req.params.id });
  });
}

// Получить все базы
async function getAllBases(req, res) {
  try {
    const bases = await Base.findAll();
    res.json(bases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Добавить базу
async function addBase(req, res) {
  try {
    const base = await Base.create(req.body);
    
    // Отправляем уведомления через Socket.IO
    const io = socket.getIO();
    io.emit('base:created', base);
    io.emit('data-updated', { 
      type: 'bases',
      action: 'created',
      data: base
    });
    
    res.status(201).json(base);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Обновить базу
async function updateBase(req, res) {
  try {
    const { id } = req.params;
    const [updated] = await Base.update(req.body, { where: { id } });
    if (updated) {
      const updatedBase = await Base.findByPk(id);
      
      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('base:updated', updatedBase);
      io.emit('data-updated', { 
        type: 'bases',
        action: 'updated',
        data: updatedBase
      });
      
      res.json(updatedBase);
    } else {
      res.status(404).json({ error: 'Base not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Удалить базу
async function deleteBase(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Base.destroy({ where: { id } });
    if (deleted) {
      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('base:deleted', id);
      io.emit('data-updated', { 
        type: 'bases',
        action: 'deleted',
        id: id
      });
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Base not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllBases,
  addBase,
  updateBase,
  deleteBase
}; 