const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  customerName: DataTypes.STRING,
  customerContact: DataTypes.STRING,
  vesselName: DataTypes.STRING,
  fuelType: DataTypes.STRING,
  volume: DataTypes.FLOAT,
  price: DataTypes.FLOAT,
  totalCost: DataTypes.FLOAT,
  status: DataTypes.STRING,
  createdAt: DataTypes.STRING,
  timestamp: DataTypes.BIGINT,
  deliveryDate: DataTypes.STRING,
  deliveryTimestamp: DataTypes.BIGINT,
  notes: DataTypes.TEXT
}, {
  timestamps: false
});

module.exports = Order; 