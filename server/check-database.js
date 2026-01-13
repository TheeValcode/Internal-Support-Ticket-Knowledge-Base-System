const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = './database.sqlite';

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file does not exist');
  console.log('🔧 Run "npm run reset-db" then restart the server');
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Check users
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`👥 Users: ${users.count}`);
  
  if (users.count > 0) {
    const userList = db.prepare('SELECT name, email, role FROM users').all();
    userList.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
  }

  // Check articles
  const articles = db.prepare('SELECT COUNT(*) as count FROM knowledge_articles').get();
  console.log(`📚 Knowledge Articles: ${articles.count}`);
  
  if (articles.count > 0) {
    const articleList = db.prepare('SELECT title, category, status FROM knowledge_articles').all();
    articleList.forEach(article => {
      console.log(`   - ${article.title} (${article.category}) - ${article.status}`);
    });
  }

  // Check tickets
  const tickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  console.log(`🎫 Tickets: ${tickets.count}`);

  // Check messages
  const messages = db.prepare('SELECT COUNT(*) as count FROM ticket_messages').get();
  console.log(`💬 Ticket Messages: ${messages.count}`);

  console.log('');
  if (users.count === 0) {
    console.log('⚠️  No users found - database needs seeding');
    console.log('🔧 Run "npm run reset-db" then restart the server');
  } else if (articles.count === 0) {
    console.log('⚠️  No articles found - knowledge base is empty');
    console.log('🔧 Run "npm run reset-db" then restart the server');
  } else {
    console.log('✅ Database looks good!');
    console.log('🚀 Knowledge base should be working properly');
  }

} catch (error) {
  console.error('❌ Error checking database:', error.message);
} finally {
  db.close();
}