const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'tvet',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

db.getConnection()
  .then(conn => {
    console.log('Connected to the MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

module.exports = db;