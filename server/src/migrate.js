import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const isCloudDb = process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || (isCloudDb ? 'test' : undefined),
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
};

async function runMigration() {
  console.log(`🔄 Connecting to MySQL server at ${config.host}:${config.port} (user: ${config.user})...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL successfully.');

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // On cloud providers where database is pre-assigned, adapt CREATE DATABASE / USE statements
    if (isCloudDb && config.database) {
      sql = sql.replace(/CREATE DATABASE IF NOT EXISTS `chatapp`[^;]*;/i, '');
      sql = sql.replace(/USE `chatapp`;/i, `USE \`${config.database}\`;`);
    }

    console.log('🚀 Executing schema.sql migration...');
    await connection.query(sql);

    console.log(`🎉 Database tables migrated successfully into \`${config.database || 'chatapp'}\`!`);
  } catch (error) {
    console.error('❌ Migration failed:', error.code || error.message || error);
    console.log('\n💡 Checklist:');
    console.log('1. Is your MySQL server running?');
    console.log('2. Does `server/.env` contain the correct DB_HOST, DB_USER, DB_PASSWORD, and DB_PORT?');
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
