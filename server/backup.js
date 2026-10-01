import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

const cmd = `mysqldump -h ${DB_HOST || 'localhost'} -u ${DB_USER || 'root'} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} -P ${DB_PORT || 3306} ${DB_NAME || 'chatapp'} > ${backupFile}`;

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.warn(`Backup stderr: ${stderr}`);
  }
  console.log(`Database backup successful: ${backupFile}`);
  
  // Cleanup old backups (keep last 7)
  const files = fs.readdirSync(BACKUP_DIR).sort().reverse();
  if (files.length > 7) {
    for (let i = 7; i < files.length; i++) {
      fs.unlinkSync(path.join(BACKUP_DIR, files[i]));
      console.log(`Deleted old backup: ${files[i]}`);
    }
  }
});
