require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'dmk@9999',
    database: process.env.DB_NAME || 'hr_portal_saven',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', underscored: true, timestamps: true },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', underscored: true, timestamps: true },
  },
};
