const FuelTransaction = require('../models/FuelTransaction');
const { User } = require('../models');
const socket = require('../socket');
const { Op } = require('sequelize');

// Московская временная зона (UTC+3)
const MOSCOW_TIMEZONE_OFFSET = 3 * 60 * 60 * 1000; // 3 часа в миллисекундах

// Функция для конвертации UTC времени в московское время
const convertToMoscowTime = (utcDate) => {
  if (!utcDate) return null;
  const date = new Date(utcDate);
  // Добавляем смещение московской временной зоны и возвращаем как строку без 'Z'
  const moscowDate = new Date(date.getTime() + MOSCOW_TIMEZONE_OFFSET);
  return moscowDate.toISOString().replace('Z', '');
};

// Функция для конвертации московского времени в UTC для сохранения в БД
const convertToUTC = (moscowDate) => {
  if (!moscowDate) return new Date();
  const date = new Date(moscowDate);
  // Вычитаем смещение московской временной зоны
  return new Date(date.getTime() - MOSCOW_TIMEZONE_OFFSET);
};

// Функция для форматирования даты в московском времени
const formatMoscowDate = (utcDate) => {
  if (!utcDate) return null;
  const moscowDate = convertToMoscowTime(utcDate);
  return moscowDate.toISOString().replace('T', ' ').substring(0, 19);
};

const fuelController = {
  async getFuelTransactions(req, res) {
    try {
      const transactions = await FuelTransaction.findAll({
        attributes: [
          'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
          'source', 'destination', 'supplier', 'customer', 'vessel',
          'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
          'createdAt', 'updatedAt', 'timestamp', 'frozen'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role']
        }]
      });

      // Конвертируем время для каждой транзакции в московское время
      const transactionsWithMoscowTime = transactions.map(transaction => {
        const transactionData = transaction.toJSON();
        if (transactionData.createdAt) {
          transactionData.createdAt = convertToMoscowTime(transactionData.createdAt);
        }
        if (transactionData.updatedAt) {
          transactionData.updatedAt = convertToMoscowTime(transactionData.updatedAt);
        }
        // Добавляем отформатированную дату для удобства
        transactionData.formattedDate = formatMoscowDate(transaction.createdAt);
        return transactionData;
      });

      res.json(transactionsWithMoscowTime);
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
        order: [['timestamp', 'DESC']]
      });

      // Конвертируем время для каждой транзакции в московское время
      const transactionsWithMoscowTime = transactions.map(transaction => {
        const transactionData = transaction.toJSON();
        if (transactionData.createdAt) {
          transactionData.createdAt = convertToMoscowTime(transactionData.createdAt);
        }
        if (transactionData.updatedAt) {
          transactionData.updatedAt = convertToMoscowTime(transactionData.updatedAt);
        }
        // Добавляем отформатированную дату для удобства
        transactionData.formattedDate = formatMoscowDate(transaction.createdAt);
        return transactionData;
      });

      res.json(transactionsWithMoscowTime);
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
          'createdAt', 'updatedAt', 'timestamp', 'frozen'
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

      // Конвертируем время в московское
      const transactionData = transaction.toJSON();
      if (transactionData.createdAt) {
        transactionData.createdAt = convertToMoscowTime(transactionData.createdAt);
      }
      if (transactionData.updatedAt) {
        transactionData.updatedAt = convertToMoscowTime(transactionData.updatedAt);
      }
      transactionData.formattedDate = formatMoscowDate(transaction.createdAt);

      res.json(transactionData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createFuelTransaction(req, res) {
    try {
      const now = new Date();
      // Используем timestamp если есть, иначе текущее время
      const utcDate = req.body.timestamp ? new Date(req.body.timestamp) : now;

      // Фильтруем только разрешенные поля
      const allowedFields = [
        'type', 'fuelType', 'volume', 'price', 'totalCost',
        'source', 'destination', 'supplier', 'customer',
        'vessel', 'bunkerVessel', 'paymentMethod', 'notes'
      ];

      const cleanData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          cleanData[field] = req.body[field];
        }
      });

      // Валидация допустимых значений
      const validTypes = ['purchase', 'sale', 'drain', 'base_to_bunker', 'bunker_to_base', 'bunker_sale', 'expense', 'repair', 'salary'];
      const validFuelTypes = ['diesel', 'gasoline', 'gasoline_95', 'gasoline_92'];
      const validPaymentMethods = ['cash', 'card', 'transfer', 'deferred'];

      if (cleanData.type && !validTypes.includes(cleanData.type)) {
        console.log('Invalid type value detected in create:', cleanData.type);
        return res.status(400).json({ error: 'Недопустимый тип операции' });
      }

      if (cleanData.fuelType && !validFuelTypes.includes(cleanData.fuelType)) {
        console.log('Invalid fuelType value detected in create:', cleanData.fuelType);
        return res.status(400).json({ error: 'Недопустимый тип топлива' });
      }

      if (cleanData.paymentMethod && !validPaymentMethods.includes(cleanData.paymentMethod)) {
        console.log('Invalid paymentMethod value detected in create:', cleanData.paymentMethod);
        return res.status(400).json({ error: 'Недопустимый способ оплаты' });
      }

      const transactionData = {
        ...cleanData,
        id: `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userRole: req.user.role,
        timestamp: utcDate.getTime(),
        createdAt: utcDate,
        updatedAt: utcDate
      };

      const transaction = await FuelTransaction.create(transactionData);

      // Конвертируем время для ответа в московское
      const responseData = transaction.toJSON();
      if (responseData.createdAt) {
        responseData.createdAt = convertToMoscowTime(responseData.createdAt);
      }
      if (responseData.updatedAt) {
        responseData.updatedAt = convertToMoscowTime(responseData.updatedAt);
      }
      responseData.formattedDate = formatMoscowDate(transaction.createdAt);

      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('transaction:created', responseData);
      io.emit('data-updated', {
        type: 'transactions',
        action: 'created',
        data: responseData
      });

      res.status(201).json(responseData);
    } catch (error) {
      console.error('Ошибка при создании транзакции:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateFuelTransaction(req, res) {
    try {
      console.log('Update transaction request:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request body keys:', Object.keys(req.body));

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

      // Подготавливаем данные для обновления - фильтруем только разрешенные поля
      const allowedFields = [
        'type', 'fuelType', 'volume', 'price', 'totalCost',
        'source', 'destination', 'supplier', 'customer',
        'vessel', 'bunkerVessel', 'paymentMethod', 'notes'
      ];

      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Валидация допустимых значений
      const validTypes = ['purchase', 'sale', 'drain', 'base_to_bunker', 'bunker_to_base', 'bunker_sale', 'expense', 'repair', 'salary'];
      const validFuelTypes = ['diesel', 'gasoline', 'gasoline_95', 'gasoline_92'];
      const validPaymentMethods = ['cash', 'card', 'transfer', 'deferred'];

      if (updateData.type && !validTypes.includes(updateData.type)) {
        console.log('Invalid type value detected:', updateData.type);
        delete updateData.type;
      }

      if (updateData.fuelType && !validFuelTypes.includes(updateData.fuelType)) {
        console.log('Invalid fuelType value detected:', updateData.fuelType);
        delete updateData.fuelType;
      }

      if (updateData.paymentMethod && !validPaymentMethods.includes(updateData.paymentMethod)) {
        console.log('Invalid paymentMethod value detected:', updateData.paymentMethod);
        delete updateData.paymentMethod;
      }

      // Обновляем только updatedAt, не трогаем createdAt
      const now = new Date();
      updateData.updatedAt = now;
      if (req.body.timestamp) {
        updateData.timestamp = req.body.timestamp;
      }

      console.log('Update data prepared:', updateData);
      console.log('Update data keys:', Object.keys(updateData));
      console.log('Is updateData empty?', Object.keys(updateData).length === 0);

      const [updated] = await FuelTransaction.update(updateData, {
        where: { id: transaction.id }
      });

      console.log('Update result:', updated);
      console.log('Transaction ID used for update:', transaction.id);

      if (updated) {
        const updatedTransaction = await FuelTransaction.findByPk(transaction.id, {
          attributes: [
            'id', 'type', 'volume', 'price', 'totalCost', 'fuelType',
            'source', 'destination', 'supplier', 'customer', 'vessel',
            'bunkerVessel', 'paymentMethod', 'notes', 'userId', 'userRole',
            'createdAt', 'updatedAt', 'timestamp', 'frozen'
          ],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'role']
          }]
        });

        // Конвертируем время для ответа в московское
        const responseData = updatedTransaction.toJSON();
        if (responseData.createdAt) {
          responseData.createdAt = convertToMoscowTime(responseData.createdAt);
        }
        if (responseData.updatedAt) {
          responseData.updatedAt = convertToMoscowTime(responseData.updatedAt);
        }
        responseData.formattedDate = formatMoscowDate(updatedTransaction.createdAt);

        // Отправляем уведомления через Socket.IO
        const io = socket.getIO();
        io.emit('transaction:updated', responseData);
        io.emit('data-updated', {
          type: 'transactions',
          action: 'updated',
          data: responseData
        });

        res.json(responseData);
      } else {
        console.log('No rows were updated. Transaction might not exist or data is the same.');
        res.status(404).json({ error: 'Transaction not found or no changes made' });
      }
    } catch (error) {
      console.error('Ошибка при обновлении транзакции:', error);
      console.error('Error stack:', error.stack);
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