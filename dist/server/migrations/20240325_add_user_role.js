module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем существование колонки
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    // Добавляем userRole, если его нет
    if (!tableInfo.userRole) {
      await queryInterface.addColumn('FuelTransactions', 'userRole', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    if (tableInfo.userRole) {
      await queryInterface.removeColumn('FuelTransactions', 'userRole');
    }
  }
}; 