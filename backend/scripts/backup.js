const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const backupDatabase = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `chat-train-backup-${timestamp}.json`);
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Get MongoDB URI from environment
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-train';
  
  console.log('📦 Starting database backup...');
  console.log(`📁 Backup file: ${backupFile}`);
  
  // Use mongodump for binary backup or mongoexport for JSON
  const command = `mongoexport --uri="${mongoUri}" --collection=users --out="${backupFile}" --jsonArray`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Backup failed:', error.message);
      return;
    }
    if (stderr) {
      console.error('⚠️  Backup warnings:', stderr);
    }
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
  });
};

// Run backup if called directly
if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;
