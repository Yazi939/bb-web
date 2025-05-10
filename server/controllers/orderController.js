const Order = require('../models/Order');
const socket = require('../socket');

// Получить все заказы
async function getAllOrders(req, res) {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Добавить заказ
async function addOrder(req, res) {
  try {
    const order = await Order.create(req.body);
    
    // Отправляем уведомления через Socket.IO
    const io = socket.getIO();
    io.emit('order:created', order);
    io.emit('data-updated', { 
      type: 'orders',
      action: 'created',
      data: order
    });
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Обновить заказ
async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const [updated] = await Order.update(req.body, { where: { id } });
    if (updated) {
      const updatedOrder = await Order.findByPk(id);
      
      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('order:updated', updatedOrder);
      io.emit('data-updated', { 
        type: 'orders',
        action: 'updated',
        data: updatedOrder
      });
      
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Удалить заказ
async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Order.destroy({ where: { id } });
    if (deleted) {
      // Отправляем уведомления через Socket.IO
      const io = socket.getIO();
      io.emit('order:deleted', id);
      io.emit('data-updated', { 
        type: 'orders',
        action: 'deleted',
        id: id
      });
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllOrders,
  addOrder,
  updateOrder,
  deleteOrder
}; 