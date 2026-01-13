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

## Self-Service Password Reset

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset instructions
5. Follow the link in the email
6. Create a new password

## Password Requirements

Your new password must:
- Be at least 8 characters long
- Include uppercase and lowercase letters
- Include at least one number
- Include at least one special character

## Troubleshooting

If you don't receive the reset email:
- Check your spam/junk folder
- Verify you entered the correct email address
- Wait 5-10 minutes for delivery
- Contact IT support if issues persist

**Need immediate help?** Contact IT support at ext. 1234`,
        category: 'Account Management',
        tags: JSON.stringify(['password', 'reset', 'login', 'account', 'security'])
      },
      {
        title: 'VPN Setup Instructions',
        content: `# VPN Configuration Guide

Connect securely to company resources from anywhere.

## Windows Setup

1. **Download the VPN client**
   - Go to company portal
   - Download "Company VPN Client"
   - Run installer as administrator

2. **Configure connection**
   - Open VPN client
   - Click "Add Connection"
   - Server: vpn.company.com
   - Username: your company email
   - Password: your network password

3. **Connect**
   - Select the connection
   - Click "Connect"
   - Enter your credentials when prompted

## Mac Setup

1. **System Preferences**
   - Open System Preferences
   - Go to Network
   - Click the "+" button

2. **VPN Configuration**
   - Interface: VPN
   - VPN Type: IKEv2
   - Service Name: Company VPN
   - Server Address: vpn.company.com
   - Remote ID: vpn.company.com

3. **Authentication**
   - Username: your company email
   - Password: your network password

## Mobile Devices

Download the "Company VPN" app from your device's app store and use the same credentials.

## Troubleshooting

- **Can't connect?** Check your internet connection first
- **Slow performance?** Try different server locations
- **Authentication failed?** Verify your credentials
- **Still having issues?** Contact IT support`,
        category: 'Network',
        tags: JSON.stringify(['vpn', 'network', 'remote', 'connection', 'security'])
      },
      {
        title: 'Software Installation Requests',
        content: `# Software Installation Process

Request new software for your company device.

## Before You Request

**Check if software is already available:**
- Look in Start Menu (Windows) or Applications (Mac)
- Check company software portal
- Ask your team if they use similar tools

## How to Request

1. **Create a support ticket**
   - Use category: "Software"
   - Priority: "Medium" (unless urgent)

2. **Include this information:**
   - Software name and version
   - Business justification
   - How many licenses needed
   - Preferred installation date
   - Any compatibility requirements

3. **Business justification examples:**
   - "Need Photoshop for marketing materials"
   - "Require specialized CAD software for engineering"
   - "Team collaboration tool for project management"

## Approval Process

1. **IT Review** (1-2 days)
   - Security assessment
   - License verification
   - Compatibility check

2. **Manager Approval** (if required)
   - Budget approval for paid software
   - Business need verification

3. **Installation** (1-2 days after approval)
   - Remote installation when possible
   - On-site visit if required

## Important Notes

- **Security first:** Only approved software allowed
- **Licensing:** We must comply with all license terms
- **Support:** We only support approved software
- **Personal software:** Not permitted on company devices

**Processing time:** 3-5 business days

Need urgent software? Mark ticket as "High" priority and explain why.`,
        category: 'Software',
        tags: JSON.stringify(['software', 'installation', 'approval', 'security', 'licensing'])
      },
      {
        title: 'Email Setup on Mobile Devices',
        content: `# Mobile Email Configuration

Set up your company email on your phone or tablet.

## iPhone/iPad Setup

1. **Settings App**
   - Open Settings
   - Tap "Mail"
   - Tap "Accounts"
   - Tap "Add Account"

2. **Account Type**
   - Select "Microsoft Exchange"
   - Or "Other" if Exchange isn't available

3. **Account Information**
   - Email: your.name@company.com
   - Server: mail.company.com
   - Domain: COMPANY
   - Username: your.name
   - Password: your email password

4. **Sync Options**
   - Choose what to sync (Mail, Contacts, Calendars)
   - Set sync period (recommended: 1 week)

## Android Setup

1. **Email App**
   - Open Gmail or Email app
   - Tap "Add Account"
   - Select "Exchange"

2. **Server Settings**
   - Email: your.name@company.com
   - Server: mail.company.com
   - Port: 993 (IMAP) or 995 (POP3)
   - Security: SSL/TLS

3. **Advanced Settings**
   - SMTP Server: smtp.company.com
   - SMTP Port: 587
   - Authentication: Required

## Security Requirements

- **PIN/Password:** Device must have screen lock
- **Remote Wipe:** IT can remotely wipe company data
- **App Restrictions:** Some apps may be blocked

## Troubleshooting

- **"Cannot verify server identity":** Contact IT for certificates
- **"Authentication failed":** Check username/password
- **"Cannot connect":** Verify server settings
- **Missing emails:** Check sync settings

**Need help?** Create a support ticket with your device model and error messages.`,
        category: 'Email',
        tags: JSON.stringify(['email', 'mobile', 'setup', 'exchange', 'configuration'])
      },
      {
        title: 'Printer Setup and Troubleshooting',
        content: `# Printer Setup Guide

Connect to company printers and resolve common issues.

## Finding Available Printers

**Windows:**
1. Settings → Devices → Printers & scanners
2. Click "Add a printer or scanner"
3. Select from available network printers

**Mac:**
1. System Preferences → Printers & Scanners
2. Click "+" to add printer
3. Select from nearby printers

## Common Company Printers

- **Main Office:** HP-LaserJet-4th-Floor
- **Conference Room A:** Canon-MX920-ConfA
- **Reception:** Brother-HL2340-Reception
- **Color Printer:** HP-ColorJet-Marketing

## Print from Mobile

1. **Install company print app**
   - Download "Company Print" from app store
   - Login with company credentials

2. **Use built-in printing**
   - iOS: Share → Print
   - Android: Menu → Print

## Troubleshooting

### Printer Not Found
- Check network connection
- Restart printer
- Update printer drivers
- Contact IT if still not visible

### Print Job Stuck
- Cancel all print jobs
- Restart printer
- Clear print queue on computer
- Try printing test page

### Poor Print Quality
- Check toner/ink levels
- Clean print heads
- Use correct paper type
- Replace cartridges if needed

### Paper Jams
1. Turn off printer
2. Remove all paper from trays
3. Open printer covers
4. Gently remove jammed paper
5. Close covers and restart

## Ordering Supplies

- **Toner/Ink:** Create ticket with printer model
- **Paper:** Contact office manager
- **Maintenance:** IT will schedule automatically

**Emergency printing?** Use the reception printer or contact IT for immediate assistance.`,
        category: 'Hardware',
        tags: JSON.stringify(['printer', 'printing', 'setup', 'troubleshooting', 'hardware'])
      },
      {
        title: 'Wi-Fi Connection Guide',
        content: `# Company Wi-Fi Setup

Connect your devices to the company wireless network.

## Available Networks

- **Company-Secure:** Main network (employees only)
- **Company-Guest:** Visitor network (limited access)
- **Company-IoT:** Device network (printers, etc.)

## Connecting to Company-Secure

### First Time Setup

1. **Select Network**
   - Choose "Company-Secure" from Wi-Fi list
   - Network type: WPA2-Enterprise

2. **Authentication**
   - Username: your company email
   - Password: your network password
   - Security: WPA2-Enterprise

3. **Certificate**
   - Accept company certificate when prompted
   - This ensures secure connection

### Automatic Connection

Once configured, your device will automatically connect when in range.

## Guest Network Access

**For visitors:**
1. Connect to "Company-Guest"
2. Open web browser
3. Enter guest code (ask reception)
4. Accept terms of use

**Guest codes expire after 24 hours**

## Troubleshooting

### Can't See Network
- Check if Wi-Fi is enabled
- Refresh network list
- Move closer to access point
- Restart device Wi-Fi

### Authentication Failed
- Verify username (full email address)
- Check password (same as email password)
- Clear saved network and reconnect
- Contact IT if password recently changed

### Connected but No Internet
- Forget and reconnect to network
- Check if certificate is installed
- Try different access point
- Contact IT support

### Slow Connection
- Check signal strength
- Move closer to access point
- Disconnect unused devices
- Try 5GHz network if available

## Security Notes

- **Never share your credentials**
- **Don't connect to unknown networks**
- **Report suspicious network activity**
- **Use VPN for sensitive work**

**Need the guest code?** Ask reception or create a support ticket.`,
        category: 'Network',
        tags: JSON.stringify(['wifi', 'wireless', 'network', 'connection', 'guest'])
      }
    ];

    const insertArticle = db.prepare(`
      INSERT OR REPLACE INTO knowledge_articles (title, content, category, tags, author_id, status)
      VALUES (?, ?, ?, ?, 1, 'published')
    `);

    articles.forEach(article => {
      insertArticle.run(article.title, article.content, article.category, article.tags);
    });

    console.log(`Database seeded successfully with ${articles.length} knowledge articles!`);
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