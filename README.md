# Support Ticket & Knowledge Base System

A full-stack internal support ticket system with knowledge base functionality, built with Node.js/Express backend and React frontend.

## 🚀 Features

### Authentication & Authorization

- User registration and login with JWT authentication
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- Demo accounts for testing

### Support Ticket System

- Create, view, and manage support tickets
- Ticket categories: Hardware, Software, Network, Access, Other
- Priority levels: Low, Medium, High, Critical
- Status tracking: Open, In Progress, Resolved, Closed
- File attachments with drag & drop upload
- Admin notes and comments
- Ticket filtering and search

### Knowledge Base

- Searchable article database
- Category-based organization
- Article view tracking
- Markdown-like content formatting
- Admin-managed content
- Tag-based navigation

### File Management

- Secure file upload for ticket attachments
- File type validation and size limits (5MB max)
- Download functionality with access control
- Support for images, PDFs, documents, text files, and logs

### Admin Features

- Admin dashboard with statistics
- Ticket management and status updates
- Knowledge base article management
- User role management

## 🛠 Technology Stack

### Backend

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **SQLite** database with better-sqlite3
- **JWT** for authentication
- **bcrypt** for password hashing
- **multer** for file uploads
- **helmet** for security headers
- **cors** for cross-origin requests
- **express-rate-limit** for API rate limiting

### Frontend

- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Context API** for state management

## 📁 Project Structure

```
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   ├── database/       # Database setup and seeds
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── uploads/            # File storage
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── common/     # Common UI components
│   │   │   ├── forms/      # Form components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── tickets/    # Ticket management pages
│   │   │   ├── knowledge/  # Knowledge base pages
│   │   │   └── admin/      # Admin pages
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd support-ticket-system
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies (for concurrent running)
   npm install

   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Backend environment
   cd server
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend environment
   cd ../frontend
   # Create .env file with:
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

### Running the Application

#### Option 1: Run both servers concurrently (recommended)

```bash
# From the root directory
npm run dev
```

#### Option 2: Run servers separately

1. **Start the backend server**

   ```bash
   cd server
   npm run dev
   ```

   The server will start on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on http://localhost:3000

### Default Demo Accounts

The system comes with pre-seeded demo accounts:

- **Admin User**

  - Email: admin@example.com
  - Password: admin123
  - Access: Full system administration

- **Regular User**
  - Email: user@example.com
  - Password: user123
  - Access: Create and manage own tickets

## 🗄 Database Management

The application automatically creates and seeds the database on first run. If you need to reset or check the database:

### Database Commands

```bash
cd server

# Check database status and content
npm run check-db

# Reset database (removes existing data and recreates)
npm run reset-db

# Manual seeding (after building)
npm run build
npm run seed
```

### Troubleshooting Database Issues

If the knowledge base appears empty or you're having login issues:

1. **Check database status**:

   ```bash
   cd server
   npm run check-db
   ```

2. **Reset database if needed**:

   ```bash
   npm run reset-db
   ```

3. **Restart the server**:
   ```bash
   npm run dev
   ```

The database will be automatically recreated with:

- 2 demo user accounts
- 6 comprehensive knowledge base articles
- Proper table structure and relationships

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Ticket Management

- `GET /api/tickets` - List tickets (filtered by user role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket (admin only)
- `POST /api/tickets/:id/notes` - Add note to ticket (admin only)
- `GET /api/tickets/:id/notes` - Get ticket notes

### Knowledge Base

- `GET /api/articles` - List published articles
- `GET /api/articles/search` - Search articles
- `GET /api/articles/:id` - Get article details
- `POST /api/articles` - Create article (admin only)
- `PUT /api/articles/:id` - Update article (admin only)
- `DELETE /api/articles/:id` - Delete article (admin only)

### File Uploads

- `POST /api/tickets/:id/attachments` - Upload file to ticket
- `GET /api/tickets/:id/attachments` - List ticket attachments
- `GET /api/attachments/:id/download` - Download attachment

## 🔧 Environment Configuration

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 🗄 Database Schema

The application uses SQLite with the following main tables:

- `users` - User accounts and authentication
- `tickets` - Support tickets
- `ticket_notes` - Comments and notes on tickets
- `knowledge_articles` - Knowledge base articles
- `attachments` - File attachments for tickets

## 🔒 Security Features

- JWT-based stateless authentication
- Password hashing with bcrypt (12 rounds)
- Input validation and sanitization
- File type and size validation
- Rate limiting on API endpoints
- CORS configuration
- Security headers with Helmet
- Role-based access control

## 🏗 Building for Production

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder with your preferred web server
```

## 🚀 AWS Migration Ready

This application is designed to be easily migrated to AWS:

### Current Architecture (Local)

- React dev server (localhost:3000)
- Express API server (localhost:5000)
- SQLite database file
- Local file system storage

### Target Architecture (AWS)

- React build deployed to S3 + CloudFront
- Express API on EC2 instance
- SQLite database on EC2 (or migrate to RDS)
- File attachments in S3 bucket

### Migration Steps

1. **Frontend**: Build and deploy to S3, configure CloudFront
2. **Backend**: Deploy to EC2, configure environment variables
3. **Files**: Migrate from local storage to S3
4. **Database**: Keep SQLite on EC2 or migrate to RDS
5. **Security**: Configure security groups, SSL certificates

## 🧪 Testing

Currently, the project structure is set up for testing but test files are not implemented. You can add tests using:

- **Backend**: Jest with Supertest
- **Frontend**: Jest with React Testing Library

## 🔮 Future Enhancements

- [ ] Email notifications for ticket updates
- [ ] Real-time updates with WebSockets
- [ ] Advanced search with filters
- [ ] Ticket assignment and workflow management
- [ ] Knowledge base article versioning
- [ ] User dashboard with analytics
- [ ] Mobile-responsive improvements
- [ ] Comprehensive test coverage
- [ ] Docker containerization
- [ ] CI/CD pipeline with GitHub Actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational and demonstration purposes.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide relevant error messages and logs

---

**Built with ❤️ for learning and demonstration purposes**

# Internal-Support-Ticket-Knowledge-Base-System
