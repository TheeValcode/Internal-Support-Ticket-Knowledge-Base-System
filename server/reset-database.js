const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing existing database...');

// Remove existing database file
const dbPath = './database.sqlite';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database file removed');
} else {
  console.log('ℹ️  No existing database found');
}

console.log('🔄 Restarting server to reinitialize database...');
console.log('📝 Database will be recreated and seeded automatically');
console.log('');
console.log('👤 Default accounts:');
console.log('   Admin: admin@example.com / admin123');
console.log('   User:  user@example.com / user123');
console.log('');
console.log('📚 Sample knowledge articles will be created');
console.log('');
console.log('🚀 Please restart your server with: npm run dev');