const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FuelTransaction = require('./FuelTransaction');
const Expense = require('./Expense');

// Определение модели User  
const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'worker',
    validate: {
      isIn: [['admin', 'moderator', 'worker', 'pier', 'bunker']]
    }
  },
  lastSync: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  tableName: 'Users'
});

// Методы для User
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.getSignedJwtToken = function() {
  return jwt.sign({ id: this.id }, 'your-super-secret-key-here', {
    expiresIn: '30d'
  });
};

// Определение модели Shift
const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeName: DataTypes.STRING,
  date: DataTypes.STRING,
  timestamp: DataTypes.BIGINT,
  shiftType: DataTypes.STRING,
  fuelSaved: DataTypes.FLOAT,
  fuelPrice: DataTypes.FLOAT,
  bonus: DataTypes.FLOAT,
  baseSalary: DataTypes.FLOAT,
  totalSalary: DataTypes.FLOAT,
  notes: DataTypes.TEXT
}, {
  timestamps: false
});

// Определение модели Data
const Data = sequelize.define('Data', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    dataType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['fuel', 'expenses', 'orders', 'shifts', 'users']]
        }
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    },
    lastModified: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

// Определяем связи
Shift.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FuelTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    User,
    Shift,
    Data,
    FuelTransaction,
    Expense
}; 