module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем существование колонок
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    // Добавляем source, если его нет
    if (!tableInfo.source) {
      await queryInterface.addColumn('FuelTransactions', 'source', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Добавляем destination, если его нет
    if (!tableInfo.destination) {
      await queryInterface.addColumn('FuelTransactions', 'destination', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Обновляем существующие записи
    await queryInterface.sequelize.query(`
      UPDATE FuelTransactions 
      SET type = 'base_to_bunker' 
      WHERE type = 'transfer' AND source = 'base' AND destination = 'bunker';
      
      UPDATE FuelTransactions 
      SET type = 'bunker_to_base' 
      WHERE type = 'transfer' AND source = 'bunker' AND destination = 'base';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('FuelTransactions');
    
    if (tableInfo.source) {
      await queryInterface.removeColumn('FuelTransactions', 'source');
    }
    
    if (tableInfo.destination) {
      await queryInterface.removeColumn('FuelTransactions', 'destination');
    }
  }
}; 