import pool from './src/config/db.js';

async function run() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN privacy_last_seen ENUM('everyone', 'contacts', 'nobody') DEFAULT 'everyone', 
      ADD COLUMN privacy_online ENUM('everyone', 'contacts', 'nobody') DEFAULT 'everyone', 
      ADD COLUMN privacy_read_receipts BOOLEAN DEFAULT TRUE;
    `);
    console.log('Privacy columns added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit(0);
  }
}

run();
