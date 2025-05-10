module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем существование колонок
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    // Добавляем supplier, если его нет
    if (!tableInfo.supplier) {
      await queryInterface.addColumn('FuelTransactions', 'supplier', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Добавляем customer, если его нет
    if (!tableInfo.customer) {
      await queryInterface.addColumn('FuelTransactions', 'customer', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Добавляем vessel, если его нет
    if (!tableInfo.vessel) {
      await queryInterface.addColumn('FuelTransactions', 'vessel', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Добавляем paymentMethod, если его нет
    if (!tableInfo.paymentMethod) {
      await queryInterface.addColumn('FuelTransactions', 'paymentMethod', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    if (tableInfo.supplier) {
      await queryInterface.removeColumn('FuelTransactions', 'supplier');
    }
    
    if (tableInfo.customer) {
      await queryInterface.removeColumn('FuelTransactions', 'customer');
    }
    
    if (tableInfo.vessel) {
      await queryInterface.removeColumn('FuelTransactions', 'vessel');
    }
    
    if (tableInfo.paymentMethod) {
      await queryInterface.removeColumn('FuelTransactions', 'paymentMethod');
    }
  }
}; 