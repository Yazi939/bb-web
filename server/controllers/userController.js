const { User } = require('../models');
const bcrypt = require('bcryptjs'); // Нужен только для updateUser

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'username', 'role']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    
    // Проверяем, не существует ли уже пользователь с таким логином
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }
    
    // Генерируем уникальный ID
    const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Создаем пользователя (пароль автоматически хешируется в модели через beforeCreate hook)
    const user = await User.create({
      id: userId,
      name,
      username,
      password, // НЕ хешируем вручную, это делается в модели
      role
    });
    
    // Возвращаем данные без пароля
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    };
    
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Если пароль пустой или не предоставлен, исключаем его из обновления
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    } else {
      // Если обновляем пароль, хешируем его (модель не хеширует при update)
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [updated] = await User.update(updateData, { where: { id } });
    if (updated) {
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'name', 'username', 'role']
      });
      return res.json(updatedUser);
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE user request for ID:', id);
    
    // Находим пользователя
    const user = await User.findByPk(id);
    console.log('Found user:', user ? `${user.username} (${user.id})` : 'not found');
    
    if (!user) {
      console.log('User not found, returning 404');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Удаляем пользователя
    await User.destroy({ where: { id } });
    console.log('User deleted successfully');
    
    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
}; 