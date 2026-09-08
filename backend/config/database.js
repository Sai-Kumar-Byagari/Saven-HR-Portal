require('dotenv').config();

const requiredEnvVars = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'JWT_REFRESH_SECRET'
];

function validateEnv() {
  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const { Sequelize } = require('sequelize');

validateEnv();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? false : false,
  }
);

module.exports = { sequelize, validateEnv };
