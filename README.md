
<div align="center">

# 🎫 Support Ticket & Knowledge Base System

### Full-Stack Helpdesk & Knowledge Management Application

A centralized platform for managing technical support requests, tracking issues, and organizing searchable documentation.

<br/>

<img src="https://skillicons.dev/icons?i=react,ts,nodejs,express,sqlite,tailwind,vite&theme=dark" alt="Technology stack" />

<br/><br/>

![TypeScript](https://img.shields.io/badge/TypeScript-064e3b?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-047857?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-065f46?style=flat-square&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-047857?style=flat-square&logo=sqlite&logoColor=white)

</div>

---

## 📖 Overview

The Support Ticket & Knowledge Base System is a full-stack application designed to bring internal support requests and technical documentation into one place.

Users can submit and monitor tickets, communicate through ticket messages, attach files, and search knowledge-base articles. Administrators have additional capabilities for managing tickets, users, and documentation.

The application combines a React and TypeScript frontend with a Node.js and Express REST API backed by SQLite.

## ✨ Key Features

### 🔐 Authentication & Authorization

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control for users and administrators
- Protected API routes

### 🎫 Support Ticket Management

- Create and view support tickets
- Categorize requests by hardware, software, network, access, or other issues
- Set ticket priorities from low to critical
- Track ticket status: open, in progress, resolved, or closed
- Search and filter tickets
- Exchange messages within ticket conversations
- Administrative ticket updates and deletion

### 📚 Knowledge Base

- Browse published knowledge-base articles
- Search documentation
- Organize articles by category and tags
- Track article views
- Create, update, and delete articles through administrator-only endpoints

### 📎 File Attachments

- Upload files to support tickets
- Retrieve attachment lists
- Download attachments
- Validate uploads through backend middleware
- Administrator-controlled attachment deletion

### 🛡️ Administration

- Manage user accounts
- View user statistics
- Activate or deactivate accounts
- Reset user passwords
- Manage ticket status and documentation

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite, better-sqlite3 |
| Authentication | JWT, bcrypt |
| Security | Helmet, CORS, express-rate-limit |
| File Uploads | Multer |
| Development | npm, Nodemon, Concurrently |

## 🏗️ Architecture

The application follows a client-server architecture.

```text
                 USER
                   |
                   v
        +----------------------+
        | React + TypeScript   |
        | Frontend :3000       |
        +----------------------+
                   |
                   | HTTP / REST
                   | JWT Bearer Token
                   v
        +----------------------+
        | Node.js + Express    |
        | Backend :5000        |
        +----------------------+
                   |
          +--------+--------+
          |                 |
          v                 v
   +-------------+   +-------------+
   | SQLite      |   | Local File  |
   | Database    |   | Storage     |
   +-------------+   +-------------+
```

### Request Flow

1. The React frontend sends requests through an Axios client.
2. The API receives requests and applies the relevant middleware.
3. Protected routes verify JWT authentication and, where required, administrator permissions.
4. Backend handlers process requests and interact with SQLite.
5. Responses return to the frontend for presentation to the user.

The frontend stores the authentication token in local storage and attaches it to API requests through an Axios interceptor.

## 📁 Project Structure

```text
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── app.ts
│   ├── .env.example
│   └── package.json
│
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Install a compatible Node.js version and npm. A current Node.js LTS release is recommended.

### 1. Clone the Repository

```bash
git clone https://github.com/TheeValcode/Internal-Support-Ticket-Knowledge-Base-System.git

cd Internal-Support-Ticket-Knowledge-Base-System
```

### 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Install the backend dependencies:

```bash
cd server
npm install
```

Install the frontend dependencies:

```bash
cd ../frontend
npm install
```

Return to the repository root:

```bash
cd ..
```

### 3. Configure Environment Variables

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

Update `JWT_SECRET` in `server/.env` with a securely generated secret.

The backend environment template includes:

```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database.sqlite
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env` containing:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not commit real secrets or local `.env` files.

### 4. Start the Application

From the repository root:

```bash
npm run dev
```

The root development script uses Concurrently to start the frontend and backend.

Default development addresses:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health endpoint: http://localhost:5000/health

Alternatively, start each application separately.

Backend:

```bash
cd server
npm run dev
```

Frontend, in another terminal:

```bash
cd frontend
npm run dev
```

**Note:** These commands reflect the repository configuration. Runtime compatibility should be verified against the installed dependency versions.

## 👤 Development Demo Accounts

The database seed script defines the following demonstration accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | admin@example.com | admin123 |
| User | user@example.com | user123 |

These credentials are for local demonstration only.

**Never deploy these seeded credentials to a public production environment.**

## 🗄️ Database

The application uses SQLite through `better-sqlite3`.

The primary database tables are:

| Table | Purpose |
|---|---|
| `users` | User accounts, roles, and authentication |
| `tickets` | Support requests and their status |
| `ticket_messages` | Ticket conversations and internal messages |
| `knowledge_articles` | Searchable technical documentation |
| `attachments` | File attachment metadata |

The backend initializes its database schema at startup and contains logic to seed demonstration data when no users exist.

### Database Utilities

Run these commands from the `server` directory:

Check database information:

```bash
npm run check-db
```

Reset the database:

```bash
npm run reset-db
```

**Warning:** Resetting the database can delete existing local data. Use it only in a development environment where data loss is acceptable.

## 📡 API Reference

The following routes are defined in the backend.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Retrieve authenticated profile |
| POST | `/api/auth/logout` | Log out |

### Tickets

Ticket endpoints require authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets` | List tickets |
| GET | `/api/tickets/search` | Search tickets |
| GET | `/api/tickets/:id` | Retrieve ticket |
| PUT | `/api/tickets/:id` | Update ticket (admin) |
| DELETE | `/api/tickets/:id` | Delete ticket (admin) |
| POST | `/api/tickets/:id/messages` | Add ticket message |
| GET | `/api/tickets/:id/messages` | List ticket messages |

### Knowledge Base

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/articles` | List articles |
| GET | `/api/articles/search` | Search articles |
| GET | `/api/articles/categories` | List categories |
| GET | `/api/articles/:id` | Retrieve article |
| POST | `/api/articles` | Create article (admin) |
| PUT | `/api/articles/:id` | Update article (admin) |
| DELETE | `/api/articles/:id` | Delete article (admin) |

### Attachments

All attachment routes require authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tickets/:ticketId/attachments` | Upload attachment |
| GET | `/api/tickets/:ticketId/attachments` | List attachments |
| GET | `/api/attachments/:id/download` | Download attachment |
| DELETE | `/api/attachments/:id` | Delete attachment (admin) |

### User Administration

The `/api/users` routes require administrator access and include user listing, searching, account creation, updates, deletion, activation, deactivation, and password resets.

## 🔒 Security Considerations

The backend includes:

- JWT authentication middleware
- Role-based authorization
- bcrypt password hashing
- Helmet security middleware
- Configurable CORS
- API rate limiting
- Upload validation middleware

These controls are implemented in the codebase but do not constitute an independent security audit.

Before any production deployment, review token storage, secret management, HTTPS configuration, file access controls, and production security headers.

## 📦 Build Commands

Build the backend:

```bash
cd server
npm run build
```

Build the frontend:

```bash
cd frontend
npm run build
```

The root package also defines:

```bash
npm run build
```

which invokes the backend and frontend build scripts.

Production deployment requires appropriate hosting, environment configuration, persistent storage, and runtime verification.

## 🧪 Testing Status

The backend includes Jest and Supertest dependencies, but automated test coverage has not been verified as complete.

Recommended testing priorities include:

- Authentication and authorization
- Ticket creation and status changes
- Role-based permissions
- Attachment validation
- Knowledge-base search
- Database initialization and migrations

## 🗺️ Roadmap

Potential future enhancements:

- [ ] Comprehensive automated tests
- [ ] Email notifications
- [ ] Real-time ticket updates
- [ ] Advanced ticket assignment workflows
- [ ] Knowledge-base version history
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Production deployment documentation

## 🤝 Contributing

Contributions and suggestions are welcome through GitHub issues and pull requests.

For proposed changes, open an issue describing the problem or enhancement before submitting a substantial pull request.

## 📄 Project Usage

This repository is maintained as a software development portfolio and demonstration project.

Consult the repository's licensing information before redistributing or reusing its code.

## 📬 Contact

**Sophia Val-Izevbigie**

[GitHub](https://github.com/TheeValcode) · [Email](mailto:sophiavalizevbigie@gmail.com)

---

<div align="center">

**Built with React, TypeScript, Node.js, Express, and SQLite.**

</div>
