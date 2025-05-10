module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаем таблицу FuelTransactions
    await queryInterface.createTable('FuelTransactions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      volume: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      totalCost: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      fuelType: {
        type: Sequelize.STRING,
        defaultValue: 'diesel'
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true
      },
      destination: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      vehicleId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Vehicles',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Создаем таблицу Users
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user'
      },
      lastSync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Создаем таблицу Vehicles
    await queryInterface.createTable('Vehicles', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        defaultValue: 'boat'
      },
      registrationNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      fuelCapacity: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      fuelConsumption: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FuelTransactions');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Vehicles');
  }
}; 