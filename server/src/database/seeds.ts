import bcrypt from 'bcrypt';
import { db } from './connection';

export const seedDatabase = async () => {
  console.log('Seeding database...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('Admin User', 'admin@example.com', adminPassword, 'admin');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run('John Doe', 'user@example.com', userPassword, 'user');

    // Create sample knowledge articles
    const articles = [
      {
        title: 'How to Reset Your Password',
        content: `# Password Reset Guide

Follow these steps to reset your password:

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset instructions
5. Follow the link in the email
6. Create a new password

If you continue to have issues, please contact IT support.`,
        category: 'Account Management',
        tags: JSON.stringify(['password', 'reset', 'login', 'account'])
      },
      {
        title: 'VPN Setup Instructions',
        content: `# VPN Configuration

To connect to the company VPN:

## Windows:
1. Open Network & Internet settings
2. Select VPN from the left menu
3. Click "Add a VPN connection"
4. Enter the server details provided by IT
5. Save and connect

## Mac:
1. Open System Preferences
2. Go to Network
3. Click the "+" button
4. Select VPN
5. Configure with provided settings

Contact IT if you need the server details or encounter issues.`,
        category: 'Network',
        tags: JSON.stringify(['vpn', 'network', 'remote', 'connection'])
      },
      {
        title: 'Software Installation Requests',
        content: `# Software Installation Process

To request new software installation:

1. Create a support ticket
2. Specify the software name and version
3. Provide business justification
4. Include any licensing information
5. Wait for IT approval

**Note:** Only approved software can be installed on company devices for security reasons.

Processing time: 2-3 business days`,
        category: 'Software',
        tags: JSON.stringify(['software', 'installation', 'approval', 'security'])
      }
    ];

    const insertArticle = db.prepare(`
      INSERT OR IGNORE INTO knowledge_articles (title, content, category, tags, author_id, status)
      VALUES (?, ?, ?, ?, 1, 'published')
    `);

    articles.forEach(article => {
      insertArticle.run(article.title, article.content, article.category, article.tags);
    });

    console.log('Database seeded successfully!');
    console.log('Admin credentials: admin@example.com / admin123');
    console.log('User credentials: user@example.com / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Run seeds if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}