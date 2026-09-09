import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isCloudDb = process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatapp',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});

export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️  Warning: MySQL connection failed (' + error.message + ').');
    console.warn('   The server is running, but database operations will fail until MySQL is accessible.');
    return false;
  }
}

export default pool;
