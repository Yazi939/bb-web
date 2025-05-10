const FuelTransaction = require('../models/FuelTransaction');
const { User } = require('../models');
const socket = require('../socket');
const { Op } = require('sequelize');

const fuelController = {
  async getFuelTransactions(req, res) {
    try {
      const transactions = await FuelTransaction.findAll({
        attributes: [
          'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
          'source', 'destination', 'supplier', 'customer', 'vessel',
          'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
          'createdAt', 'updatedAt'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role']
        }]
      });
      res.json(transactions);
    } catch (error) {
      console.error('Ошибка при получении транзакций:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllTransactions(req, res) {
    try {
      const transactions = await FuelTransaction.findAll({
        attributes: [
          'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
          'source', 'destination', 'supplier', 'customer', 'vessel',
          'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
          'createdAt', 'updatedAt', 'timestamp', 'frozen'
        ],
        order: [['timestamp', 'ASC']]
      });
      res.json(transactions);
    } catch (error) {
      console.error('Ошибка при получении всех транзакций:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getFuelTransaction(req, res) {
    try {
      const transaction = await FuelTransaction.findByPk(req.params.id, {
        attributes: [
          'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
          'source', 'destination', 'supplier', 'customer', 'vessel',
          'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
          'createdAt', 'updatedAt'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role']
        }]
      });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createFuelTransaction(req, res) {
    try {
      const transactionData = {
        ...req.body,
        id: `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userRole: req.user.role,
        createdAt: req.body.date ? new Date(req.body.date) : new Date(),
        updatedAt: req.body.date ? new Date(req.body.date) : new Date()
      };
      const transaction = await FuelTransaction.create(transactionData);
      
      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('transaction:created', transaction);
      io.emit('data-updated', { 
        type: 'transactions',
        action: 'created',
        data: transaction
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Ошибка при создании транзакции:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateFuelTransaction(req, res) {
    try {
      // Найти транзакцию по id
      let transaction = await FuelTransaction.findByPk(req.params.id);
      if (!transaction) {
        // Пробуем найти по id без префикса 'transaction-'
        const idWithoutPrefix = req.params.id.replace(/^transaction-/, '');
        transaction = await FuelTransaction.findByPk(idWithoutPrefix);
        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }
      }

      // Проверка прав: только админ или владелец может изменять
      if (req.user.role !== 'admin' && req.user.id !== transaction.userId) {
        return res.status(403).json({ error: 'Нет прав на изменение этой транзакции' });
      }

      const [updated] = await FuelTransaction.update(req.body, {
        where: { id: transaction.id }
      });
      if (updated) {
        const updatedTransaction = await FuelTransaction.findByPk(transaction.id, {
          attributes: [
            'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
            'source', 'destination', 'supplier', 'customer', 'vessel',
            'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
            'createdAt', 'updatedAt'
          ],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'role']
          }]
        });
        
        // Отправляем уведомления через Socket.IO
        const io = socket.getIO();
        io.emit('transaction:updated', updatedTransaction);
        io.emit('data-updated', { 
          type: 'transactions',
          action: 'updated',
          data: updatedTransaction
        });
        
        res.json(updatedTransaction);
      } else {
        res.status(404).json({ error: 'Transaction not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteFuelTransaction(req, res) {
    try {
      console.log('Attempting to delete transaction with id:', req.params.id);
      
      // Сначала проверим, существует ли транзакция
      let transaction = await FuelTransaction.findByPk(req.params.id);
      console.log('Found transaction:', transaction ? 'yes' : 'no');
      
      if (!transaction) {
        // Пробуем найти по id без префикса 'transaction-'
        const idWithoutPrefix = req.params.id.replace(/^transaction-/, '');
        transaction = await FuelTransaction.findByPk(idWithoutPrefix);
        console.log('Found old format transaction:', transaction ? 'yes' : 'no');

        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }
      }

      // Проверка прав: только админ или владелец может удалить
      if (req.user.role !== 'admin' && req.user.id !== transaction.userId) {
        return res.status(403).json({ error: 'Нет прав на удаление этой транзакции' });
      }

      const deleted = await FuelTransaction.destroy({
        where: { id: transaction.id }
      });
      
      console.log('Delete result:', deleted);
      
      if (deleted) {
        // Отправляем уведомления через Socket.IO
        const io = socket.getIO();
        io.emit('transaction:deleted', transaction.id);
        io.emit('data-updated', { 
          type: 'transactions',
          action: 'deleted',
          id: transaction.id
        });
        
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Transaction not found' });
      }
    } catch (error) {
      console.error('Ошибка при удалении транзакции:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = fuelController; 