const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Пожалуйста, укажите имя' },
      len: {
        args: [1, 50],
        msg: 'Имя не может быть длиннее 50 символов'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Пожалуйста, укажите корректный email' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6],
        msg: 'Пароль должен быть не менее 6 символов'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'worker'),
    defaultValue: 'worker'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Метод для генерации JWT токена
User.prototype.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
};

// Метод для проверки пароля
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User; 