module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Для SQLite нам нужно пересоздать таблицу с новыми ограничениями
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "FuelTransactions_new" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "volume" REAL NOT NULL,
        "price" REAL NOT NULL,
        "totalCost" REAL NOT NULL,
        "fuelType" TEXT NOT NULL DEFAULT 'diesel',
        "source" TEXT,
        "destination" TEXT,
        "supplier" TEXT,
        "customer" TEXT,
        "vessel" TEXT,
        "bunkerVessel" TEXT,
        "paymentMethod" TEXT,
        "notes" TEXT,
        "userId" TEXT,
        "createdAt" DATETIME NOT NULL,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
      
      INSERT INTO "FuelTransactions_new" 
      SELECT * FROM "FuelTransactions";
      
      DROP TABLE "FuelTransactions";
      
      ALTER TABLE "FuelTransactions_new" RENAME TO "FuelTransactions";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Восстанавливаем старую структуру таблицы
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "FuelTransactions_old" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "volume" REAL NOT NULL,
        "price" REAL NOT NULL,
        "totalCost" REAL NOT NULL,
        "fuelType" TEXT NOT NULL DEFAULT 'diesel',
        "source" TEXT,
        "destination" TEXT,
        "supplier" TEXT,
        "customer" TEXT,
        "vessel" TEXT,
        "bunkerVessel" TEXT,
        "paymentMethod" TEXT,
        "notes" TEXT,
        "userId" TEXT,
        "createdAt" DATETIME NOT NULL,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "Users" ("id")
      );
      
      INSERT INTO "FuelTransactions_old" 
      SELECT * FROM "FuelTransactions";
      
      DROP TABLE "FuelTransactions";
      
      ALTER TABLE "FuelTransactions_old" RENAME TO "FuelTransactions";
    `);
  }
}; 