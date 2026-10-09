const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const fs = require('fs');

const dialect = process.env.DB_DIALECT || ((process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'postgres' : 'sqlite');
let sequelize;

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else if (dialect === 'mysql') {
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
      dialectOptions: {
        ssl: process.env.DB_SSL === 'false' ? false : {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    }
  );
} else {
  // SQLite default (handles Vercel read-only filesystem by leveraging /tmp)
  let storagePath = process.env.DB_STORAGE;
  if (!storagePath) {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      storagePath = '/tmp/campus_ai.sqlite';
      const possibleBundledPaths = [
        path.join(process.cwd(), 'campus_ai.sqlite'),
        path.join(__dirname, '../../campus_ai.sqlite'),
        path.join(__dirname, '../campus_ai.sqlite'),
        path.join(__dirname, 'campus_ai.sqlite')
      ];
      const bundledDb = possibleBundledPaths.find(p => fs.existsSync(p));
      if (bundledDb && !fs.existsSync(storagePath)) {
        try {
          fs.copyFileSync(bundledDb, storagePath);
          console.log('[CAMPUS AI] Seeded SQLite database copied to /tmp from:', bundledDb);
        } catch (copyErr) {
          console.warn('[CAMPUS AI] Note: could not copy SQLite to /tmp:', copyErr.message);
        }
      }
    } else {
      storagePath = path.join(__dirname, '../../campus_ai.sqlite');
    }
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(storagePath),
    logging: false
  });
}

module.exports = sequelize;
