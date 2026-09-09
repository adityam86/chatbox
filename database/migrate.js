import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env if present
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true,
};

async function runMigration() {
  console.log('🔄 Connecting to MySQL server at ' + config.host + ':' + config.port + '...');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL successfully.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Running schema migration...');
    await connection.query(sql);

    console.log('🎉 Database and tables migrated successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Tip: Check that your MySQL server is running and server/.env contains valid DB credentials.');
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
