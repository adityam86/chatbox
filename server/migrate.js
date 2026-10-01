import pool from './src/config/db.js';
async function migrate() {
  try {
    await pool.query('ALTER TABLE messages ADD COLUMN expires_at DATETIME DEFAULT NULL');
    await pool.query('CREATE INDEX idx_messages_expires ON messages (expires_at)');
    console.log('Migration successful');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Migration already applied');
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}
migrate();
