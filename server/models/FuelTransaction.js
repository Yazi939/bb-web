const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FuelTransaction = sequelize.define('FuelTransaction', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['purchase', 'sale', 'drain', 'base_to_bunker', 'bunker_to_base', 'expense', 'repair', 'salary']]
    }
  },
  volume: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Количество топлива должно быть положительным числом' }
    }
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Цена топлива должна быть положительным числом' }
    }
  },
  totalCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Общая стоимость должна быть положительным числом' }
    }
  },
  fuelType: {
    type: DataTypes.STRING,
    defaultValue: 'diesel',
    allowNull: true,
    validate: {
      isIn: [['diesel', 'gasoline', 'gasoline_95', 'gasoline_92']]
    }
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vessel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bunkerVessel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['cash', 'card', 'transfer', 'deferred']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'FuelTransactions'
});

module.exports = FuelTransaction; 