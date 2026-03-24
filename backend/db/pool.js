const mysql = require('mysql2');
require('dotenv').config();

// create connection pool (similar concept to pg Pool)
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // e.g. localhost
  user: process.env.DB_USER,       // e.g. root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// optional: use promise wrapper (recommended)
const promisePool = pool.promise();

// test connection
promisePool.getConnection()
  .then((conn) => {
    console.log('✅ Connected to MySQL database');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

module.exports = promisePool;