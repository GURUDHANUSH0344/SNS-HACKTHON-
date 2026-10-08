const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'campus_ai_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else if (dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'campus_ai_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false
    }
  );
} else {
  // SQLite default
  const storagePath = path.resolve(
    process.env.DB_STORAGE || path.join(__dirname, '../../campus_ai.sqlite')
  );
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
}

module.exports = sequelize;
