# Phase 2: AWS Cloud Migration - Detailed Explanation

## Overview

Phase 2 transforms our local development application into a production-ready cloud deployment on AWS. This involves both **infrastructure changes** (setting up AWS services) and **code modifications** (adapting the application for cloud services).

## Current State (Phase 1) vs Target State (Phase 2)

### Phase 1: Local Development

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│  SQLite DB      │
│ localhost:3000  │    │ localhost:5000  │    │ ./database.db   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ ./uploads/      │
                       │ (Local Files)   │
                       └─────────────────┘
```

### Phase 2: AWS Cloud Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   EC2 Instance  │────│  SQLite/RDS     │
│   (Global CDN)  │    │  (API Server)   │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   S3 Bucket     │    │   S3 Bucket     │
│  (Frontend)     │    │ (Attachments)   │
└─────────────────┘    └─────────────────┘
```

## AWS Services Architecture

### Core Services Required

#### 1. **Amazon S3 (Simple Storage Service)**

- **Purpose**: Host static frontend files and store file attachments
- **Two Buckets Needed**:
  - `support-ticket-frontend`: React build files (HTML, CSS, JS)
  - `support-ticket-attachments`: User-uploaded files
- **Benefits**: 99.999999999% durability, automatic scaling, cost-effective

#### 2. **Amazon EC2 (Elastic Compute Cloud)**

- **Purpose**: Host the Express.js backend API
- **Instance Type**: t3.micro (free tier eligible)
- **Configuration**: Node.js runtime, PM2 process manager
- **Benefits**: Full control, scalable, familiar Linux environment

#### 3. **Amazon CloudFront (CDN)**

- **Purpose**: Global content delivery for frontend
- **Configuration**: Points to S3 frontend bucket
- **Benefits**: Faster load times worldwide, HTTPS termination, caching

#### 4. **AWS IAM (Identity and Access Management)**

- **Purpose**: Security and permissions management
- **Components**: Users, roles, policies for secure access
- **Benefits**: Fine-grained access control, security best practices

### Optional Enhancement Services

#### 5. **Amazon RDS (Relational Database Service)**

- **Purpose**: Replace SQLite with managed PostgreSQL/MySQL
- **Benefits**: Automated backups, scaling, high availability
- **Migration Path**: Export SQLite → Import to RDS

#### 6. **Amazon SES (Simple Email Service)**

- **Purpose**: Send ticket notification emails
- **Integration**: Replace console.log with actual email sending
- **Benefits**: Reliable email delivery, bounce handling

## Migration Process Breakdown

### Step 1: Infrastructure Setup

#### AWS Account Preparation

```bash
# 1. Create AWS account
# 2. Set up billing alerts
# 3. Create IAM user with programmatic access
# 4. Install AWS CLI and configure credentials
aws configure
```

#### S3 Bucket Creation

```bash
# Create frontend hosting bucket
aws s3 mb s3://your-app-frontend-bucket

# Create attachments storage bucket
aws s3 mb s3://your-app-attachments-bucket

# Configure frontend bucket for static website hosting
aws s3 website s3://your-app-frontend-bucket \
  --index-document index.html \
  --error-document error.html
```

#### EC2 Instance Setup

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --count 1 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-12345678

# Configure security group (firewall rules)
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### Step 2: Code Modifications

#### Frontend Changes

The React frontend requires minimal changes:

```typescript
// Before: Local API calls
const API_BASE_URL = "http://localhost:5000/api";

// After: Production API calls
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://your-ec2-domain.com/api";
```

#### Backend Changes - File Service Migration

**Current Local File Service:**

```typescript
class LocalFileService {
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const filePath = path.join("./uploads", filename);
    await fs.writeFile(filePath, file);
    return `/uploads/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const filePath = path.join("./uploads", filename);
    return await fs.readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join("./uploads", filename);
    await fs.unlink(filePath);
  }
}
```

**New S3 File Service:**

```typescript
import AWS from "aws-sdk";

class S3FileService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucketName = process.env.S3_ATTACHMENTS_BUCKET!;
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
      Body: file,
      ContentType: "application/octet-stream",
      ServerSideEncryption: "AES256", // Enable encryption
    };

    try {
      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      logger.error("S3 upload failed", { filename, error: error.message });
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
    };

    try {
      const result = await this.s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      logger.error("S3 download failed", { filename, error: error.message });
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      logger.error("S3 delete failed", { filename, error: error.message });
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Generate pre-signed URLs for secure direct downloads
  getSignedDownloadUrl(filename: string, expiresIn: number = 3600): string {
    return this.s3.getSignedUrl("getObject", {
      Bucket: this.bucketName,
      Key: filename,
      Expires: expiresIn, // Default 1 hour
    });
  }

  // List objects (for health checks)
  async listObjects(options: { MaxKeys: number }): Promise<AWS.S3.ListObjectsV2Output> {
    const params = {
      Bucket: this.bucketName,
      MaxKeys: options.MaxKeys,
    };

    return await this.s3.listObjectsV2(params).promise();
  }
}
```

**File Service Factory Pattern:**

```typescript
// File: src/services/fileService.ts
import { LocalFileService } from "./LocalFileService";
import { S3FileService } from "./S3FileService";

// Define common interface for both services
export interface IFileService {
  uploadFile(file: Buffer, filename: string): Promise<string>;
  downloadFile(filename: string): Promise<Buffer>;
  deleteFile(filename: string): Promise<void>;
  getSignedDownloadUrl?(filename: string, expiresIn?: number): string;
}

// Factory function to create the appropriate file service
export function createFileService(): IFileService {
  const storageType = process.env.STORAGE_TYPE || "local";

  if (storageType === "s3") {
    console.log("Using S3 file storage");
    return new S3FileService();
  } else {
    console.log("Using local file storage");
    return new LocalFileService();
  }
}

// Export singleton instance
export const fileService = createFileService();
```

**Updated LocalFileService with Interface:**

```typescript
// File: src/services/LocalFileService.ts
import fs from "fs/promises";
import path from "path";
import { IFileService } from "./fileService";

export class LocalFileService implements IFileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || "./uploads";
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, file);
    return `/uploads/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename);
    return await fs.readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.unlink(filePath);
  }

  // Local storage doesn't need signed URLs, return direct path
  getSignedDownloadUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
```

**Multer Configuration for S3:**

```typescript
// File: src/middleware/upload.ts
import multer from "multer";
import multerS3 from "multer-s3";
import AWS from "aws-sdk";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_ATTACHMENTS_BUCKET!,
  serverSideEncryption: "AES256",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      uploadedBy: req.user?.id || "anonymous",
      uploadedAt: new Date().toISOString(),
    });
  },
  key: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, `attachments/${uniqueFilename}`);
  },
});

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

// Create multer instance based on environment
const storage = process.env.STORAGE_TYPE === "s3" ? s3Storage : localStorage;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Usage in routes
// Single file: upload.single('attachment')
// Multiple files: upload.array('attachments', 5)
```

**Using File Service in Controllers:**

```typescript
// File: src/controllers/ticketController.ts
import { Request, Response } from "express";
import { fileService } from "../services/fileService";

export async function uploadAttachment(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // With multer-s3, file is already uploaded to S3
    // req.file.location contains the S3 URL
    const fileUrl = req.file.location || req.file.path;

    // Save file reference to database
    const attachment = await db.run(
      `INSERT INTO attachments (ticket_id, filename, file_url, uploaded_by) 
       VALUES (?, ?, ?, ?)`,
      [req.params.ticketId, req.file.originalname, fileUrl, req.user.id]
    );

    res.json({
      success: true,
      attachment: {
        id: attachment.lastID,
        filename: req.file.originalname,
        url: fileUrl,
      },
    });
  } catch (error) {
    logger.error("File upload failed", { error: error.message });
    res.status(500).json({ error: "Failed to upload file" });
  }
}

export async function downloadAttachment(req: Request, res: Response) {
  try {
    const attachment = await db.get(
      "SELECT * FROM attachments WHERE id = ?",
      [req.params.attachmentId]
    );

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // For S3, generate signed URL
    if (process.env.STORAGE_TYPE === "s3") {
      const signedUrl = fileService.getSignedDownloadUrl!(attachment.filename);
      return res.redirect(signedUrl);
    }

    // For local storage, stream the file
    const fileBuffer = await fileService.downloadFile(attachment.filename);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    logger.error("File download failed", { error: error.message });
    res.status(500).json({ error: "Failed to download file" });
  }
}

export async function deleteAttachment(req: Request, res: Response) {
  try {
    const attachment = await db.get(
      "SELECT * FROM attachments WHERE id = ?",
      [req.params.attachmentId]
    );

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Delete from storage
    await fileService.deleteFile(attachment.filename);

    // Delete from database
    await db.run("DELETE FROM attachments WHERE id = ?", [req.params.attachmentId]);

    res.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    logger.error("File deletion failed", { error: error.message });
    res.status(500).json({ error: "Failed to delete file" });
  }
}
```

#### Environment Configuration Changes

**Local Environment (.env):**

```bash
# Database
DATABASE_PATH=./database.sqlite

# File Storage
UPLOAD_DIR=./uploads

# API
PORT=5000
JWT_SECRET=your-local-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

**Production Environment (EC2):**

```bash
# Database
DATABASE_PATH=/home/ec2-user/app/database.sqlite

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_ATTACHMENTS_BUCKET=your-app-attachments-bucket

# API
PORT=80
JWT_SECRET=your-production-secret-key

# CORS
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
```

### Step 3: Deployment Process

#### Frontend Deployment to S3

```bash
# Build the React application
cd frontend
npm run build

# Deploy to S3
aws s3 sync ./dist s3://your-app-frontend-bucket --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"
```

#### Backend Deployment to EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js and dependencies
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install PM2 for process management
npm install -g pm2

# Upload application code
scp -i your-key.pem -r ./backend ec2-user@your-ec2-ip:/home/ec2-user/

# On EC2: Install dependencies and start application
cd /home/ec2-user/backend
npm install
npm run build
pm2 start dist/app.js --name "support-ticket-api"
pm2 startup
pm2 save
```

## Security Considerations

### S3 Bucket Policies

**Frontend Bucket (Public Read):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-frontend-bucket/*"
    }
  ]
}
```

**Attachments Bucket (Private with Signed URLs):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-attachments-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/EC2-S3-Access-Role"
        }
      }
    }
  ]
}
```

### S3 Bucket Encryption

Enable server-side encryption for all buckets:

```bash
# Enable encryption for attachments bucket
aws s3api put-bucket-encryption \
  --bucket your-app-attachments-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access for attachments bucket
aws s3api put-public-access-block \
  --bucket your-app-attachments-bucket \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### IAM Roles and Policies

**EC2 Instance Role for S3 Access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-app-attachments-bucket",
        "arn:aws:s3:::your-app-attachments-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:prod/support-ticket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### VPC Configuration

**Create VPC with Public and Private Subnets:**

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=support-ticket-vpc}]'

# Create public subnet for EC2
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet}]'

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=support-ticket-igw}]'
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxx --internet-gateway-id igw-xxxxx

# Create route table and associate with public subnet
aws ec2 create-route-table --vpc-id vpc-xxxxx
aws ec2 create-route --route-table-id rtb-xxxxx --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxxxx
aws ec2 associate-route-table --subnet-id subnet-xxxxx --route-table-id rtb-xxxxx
```

### EC2 Security Groups

**Application Security Group:**

```bash
# Create security group
aws ec2 create-security-group \
  --group-name support-ticket-api-sg \
  --description "Security group for Support Ticket API" \
  --vpc-id vpc-xxxxx

# Inbound rules
# HTTP (80) - for initial setup, will redirect to HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# HTTPS (443) - primary production traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# SSH (22) - restricted to your IP only
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32

# Outbound rules (default allows all, but can be restricted)
```

### CORS Configuration

**Backend CORS Middleware:**

```typescript
import cors from "cors";

// Development CORS configuration
const devCorsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Production CORS configuration
const prodCorsOptions = {
  origin: [
    process.env.FRONTEND_URL!, // CloudFront URL
    "https://your-custom-domain.com", // Custom domain if configured
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

// Apply CORS based on environment
const corsOptions =
  process.env.NODE_ENV === "production" ? prodCorsOptions : devCorsOptions;

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));
```

### SSL/HTTPS Setup (Required for Production)

**Using Let's Encrypt with Certbot:**

```bash
# Install Certbot on EC2
sudo yum install -y certbot python3-certbot-nginx

# Install Nginx as reverse proxy
sudo yum install -y nginx

# Configure Nginx
sudo tee /etc/nginx/conf.d/support-ticket.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Obtain SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### AWS Secrets Manager Integration

**Store Sensitive Configuration:**

```bash
# Create secret for production credentials
aws secretsmanager create-secret \
  --name prod/support-ticket/api \
  --description "Production credentials for Support Ticket API" \
  --secret-string '{
    "JWT_SECRET": "your-super-secure-jwt-secret-key-here",
    "DATABASE_ENCRYPTION_KEY": "your-database-encryption-key",
    "AWS_ACCESS_KEY_ID": "AKIA...",
    "AWS_SECRET_ACCESS_KEY": "..."
  }'
```

**Backend Code to Retrieve Secrets:**

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

class SecretsService {
  private client: SecretsManagerClient;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  async getSecret(secretName: string): Promise<any> {
    // Check cache first
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      const secret = JSON.parse(response.SecretString || "{}");
      this.cache.set(secretName, secret);

      return secret;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw error;
    }
  }

  // Refresh secrets periodically (call this on a schedule)
  clearCache(): void {
    this.cache.clear();
  }
}

// Initialize secrets on application startup
const secretsService = new SecretsService();

async function initializeApp() {
  if (process.env.NODE_ENV === "production") {
    const secrets = await secretsService.getSecret("prod/support-ticket/api");

    // Override environment variables with secrets
    process.env.JWT_SECRET = secrets.JWT_SECRET;
    process.env.DATABASE_ENCRYPTION_KEY = secrets.DATABASE_ENCRYPTION_KEY;
    process.env.AWS_ACCESS_KEY_ID = secrets.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = secrets.AWS_SECRET_ACCESS_KEY;
  }

  // Continue with app initialization
  startServer();
}

initializeApp();
```

### API Rate Limiting

**Implement Rate Limiting Middleware:**

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

// For production with Redis (optional but recommended)
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

// General API rate limiter
const apiLimiter = rateLimit({
  store: process.env.NODE_ENV === "production"
    ? new RedisStore({ client: redis })
    : undefined, // Use memory store in development
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful logins
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: "Upload limit exceeded, please try again later.",
});

// Apply rate limiters
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/tickets/*/attachments", uploadLimiter);
```

## Cost Optimization

### Free Tier Usage

- **EC2**: t3.micro instance (750 hours/month free)
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **CloudFront**: 50GB data transfer, 2,000,000 requests
- **Data Transfer**: 15GB outbound per month

### Estimated Monthly Costs (After Free Tier)

- **EC2 t3.micro**: ~$8.50/month
- **S3 Storage**: ~$0.10/GB/month
- **CloudFront**: ~$0.085/GB for data transfer
- **Total**: ~$10-15/month for small application

## Operational Procedures

### CloudWatch Monitoring and Alerts

**Install CloudWatch Agent on EC2:**

```bash
# Download and install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{
  "metrics": {
    "namespace": "SupportTicketApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ec2-user/app/logs/application.log",
            "log_group_name": "/aws/ec2/support-ticket-api",
            "log_stream_name": "{instance_id}/application",
            "timezone": "UTC"
          },
          {
            "file_path": "/home/ec2-user/app/logs/error.log",
            "log_group_name": "/aws/ec2/support-ticket-api",
            "log_stream_name": "{instance_id}/errors",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

**Create CloudWatch Alarms:**

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name support-ticket-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name support-ticket-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MEM_USED \
  --namespace SupportTicketApp \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts

# Application error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name support-ticket-error-rate \
  --alarm-description "Alert when error rate is high" \
  --metric-name Errors \
  --namespace SupportTicketApp \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts

# Disk space alarm
aws cloudwatch put-metric-alarm \
  --alarm-name support-ticket-disk-space \
  --alarm-description "Alert when disk usage exceeds 80%" \
  --metric-name DISK_USED \
  --namespace SupportTicketApp \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts
```

### Comprehensive Logging Strategy

**Install and Configure Winston Logger:**

```typescript
import winston from "winston";
import CloudWatchTransport from "winston-cloudwatch";

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "support-ticket-api",
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // File transports for local development
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/application.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add CloudWatch transport for production
if (process.env.NODE_ENV === "production") {
  logger.add(
    new CloudWatchTransport({
      logGroupName: "/aws/ec2/support-ticket-api",
      logStreamName: `${process.env.INSTANCE_ID || "local"}/application`,
      awsRegion: process.env.AWS_REGION,
      messageFormatter: ({ level, message, ...meta }) => {
        return JSON.stringify({ level, message, ...meta });
      },
    })
  );
}

// Export logger
export default logger;

// Usage in application
import logger from "./logger";

// Log different levels
logger.info("User logged in", { userId: user.id, email: user.email });
logger.warn("High API usage detected", { ip: req.ip, count: requestCount });
logger.error("Database connection failed", { error: error.message, stack: error.stack });

// Express middleware for request logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error("Application Error", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    userId: req.user?.id,
  });

  next(err);
};
```

### Automated Database Backup Strategy

**Create Backup Script:**

```bash
#!/bin/bash
# File: /home/ec2-user/scripts/backup-database.sh

# Configuration
DB_PATH="/home/ec2-user/app/database.sqlite"
BACKUP_DIR="/home/ec2-user/backups"
S3_BUCKET="your-app-database-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backup_${TIMESTAMP}.sqlite"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create backup
echo "Creating database backup..."
sqlite3 ${DB_PATH} ".backup '${BACKUP_DIR}/${BACKUP_FILE}'"

# Compress backup
echo "Compressing backup..."
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Upload to S3
echo "Uploading to S3..."
aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE}.gz s3://${S3_BUCKET}/backups/${BACKUP_FILE}.gz

# Verify upload
if [ $? -eq 0 ]; then
    echo "Backup uploaded successfully"
    
    # Remove local backup after successful upload
    rm ${BACKUP_DIR}/${BACKUP_FILE}.gz
    
    # Log success
    echo "$(date): Backup successful - ${BACKUP_FILE}.gz" >> /home/ec2-user/logs/backup.log
else
    echo "Backup upload failed"
    echo "$(date): Backup failed - ${BACKUP_FILE}.gz" >> /home/ec2-user/logs/backup.log
    exit 1
fi

# Clean up old backups from S3 (older than RETENTION_DAYS)
echo "Cleaning up old backups..."
aws s3 ls s3://${S3_BUCKET}/backups/ | while read -r line; do
    createDate=$(echo $line | awk {'print $1" "$2'})
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "-${RETENTION_DAYS} days" +%s)
    
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk {'print $4'})
        if [[ $fileName != "" ]]; then
            echo "Deleting old backup: $fileName"
            aws s3 rm s3://${S3_BUCKET}/backups/$fileName
        fi
    fi
done

echo "Backup process completed"
```

**Set Up Automated Backups with Cron:**

```bash
# Make backup script executable
chmod +x /home/ec2-user/scripts/backup-database.sh

# Create logs directory
mkdir -p /home/ec2-user/logs

# Add to crontab (runs daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /home/ec2-user/scripts/backup-database.sh

# For hourly backups during business hours (9 AM - 6 PM):
0 9-18 * * * /home/ec2-user/scripts/backup-database.sh
```

**Database Restore Script:**

```bash
#!/bin/bash
# File: /home/ec2-user/scripts/restore-database.sh

# Usage: ./restore-database.sh <backup-filename>

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-filename>"
    echo "Example: $0 database_backup_20260116_020000.sqlite.gz"
    exit 1
fi

BACKUP_FILE=$1
S3_BUCKET="your-app-database-backups"
DB_PATH="/home/ec2-user/app/database.sqlite"
RESTORE_DIR="/home/ec2-user/restore"

# Create restore directory
mkdir -p ${RESTORE_DIR}

# Download backup from S3
echo "Downloading backup from S3..."
aws s3 cp s3://${S3_BUCKET}/backups/${BACKUP_FILE} ${RESTORE_DIR}/${BACKUP_FILE}

# Decompress backup
echo "Decompressing backup..."
gunzip ${RESTORE_DIR}/${BACKUP_FILE}

# Stop application
echo "Stopping application..."
pm2 stop support-ticket-api

# Backup current database
echo "Backing up current database..."
cp ${DB_PATH} ${DB_PATH}.pre-restore.$(date +%Y%m%d_%H%M%S)

# Restore database
echo "Restoring database..."
UNCOMPRESSED_FILE=${BACKUP_FILE%.gz}
cp ${RESTORE_DIR}/${UNCOMPRESSED_FILE} ${DB_PATH}

# Start application
echo "Starting application..."
pm2 start support-ticket-api

# Verify application is running
sleep 5
pm2 status support-ticket-api

echo "Database restore completed"
```

### CI/CD Pipeline with GitHub Actions

**Create GitHub Actions Workflow:**

```yaml
# File: .github/workflows/deploy-production.yml
name: Deploy to AWS Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  EC2_HOST: ${{ secrets.EC2_HOST }}
  EC2_USER: ec2-user
  S3_FRONTEND_BUCKET: your-app-frontend-bucket
  CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run backend tests
        working-directory: ./backend
        run: npm test

      - name: Run backend linter
        working-directory: ./backend
        run: npm run lint

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test

      - name: Run frontend linter
        working-directory: ./frontend
        run: npm run lint

  deploy-frontend:
    name: Deploy Frontend to S3
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build frontend
        working-directory: ./frontend
        env:
          REACT_APP_API_URL: ${{ secrets.PRODUCTION_API_URL }}
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to S3
        working-directory: ./frontend
        run: |
          aws s3 sync ./dist s3://${{ env.S3_FRONTEND_BUCKET }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  deploy-backend:
    name: Deploy Backend to EC2
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Build backend
        working-directory: ./backend
        run: npm run build

      - name: Create deployment package
        run: |
          cd backend
          tar -czf ../backend-deploy.tar.gz dist package.json package-lock.json

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ env.EC2_HOST }} >> ~/.ssh/known_hosts

      - name: Upload to EC2
        run: |
          scp -i ~/.ssh/deploy_key backend-deploy.tar.gz ${{ env.EC2_USER }}@${{ env.EC2_HOST }}:/home/ec2-user/

      - name: Deploy on EC2
        run: |
          ssh -i ~/.ssh/deploy_key ${{ env.EC2_USER }}@${{ env.EC2_HOST }} << 'ENDSSH'
            # Backup current version
            if [ -d ~/app ]; then
              mv ~/app ~/app.backup.$(date +%Y%m%d_%H%M%S)
            fi
            
            # Extract new version
            mkdir -p ~/app
            tar -xzf ~/backend-deploy.tar.gz -C ~/app
            
            # Install production dependencies
            cd ~/app
            npm ci --production
            
            # Restart application with PM2
            pm2 restart support-ticket-api || pm2 start dist/app.js --name support-ticket-api
            
            # Save PM2 configuration
            pm2 save
            
            # Clean up
            rm ~/backend-deploy.tar.gz
            
            # Keep only last 3 backups
            ls -dt ~/app.backup.* | tail -n +4 | xargs rm -rf
          ENDSSH

      - name: Health check
        run: |
          sleep 10
          curl -f https://${{ env.EC2_HOST }}/health || exit 1

  notify:
    name: Send Deployment Notification
    needs: [deploy-frontend, deploy-backend]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Send notification
        run: |
          echo "Deployment completed: ${{ needs.deploy-frontend.result }} / ${{ needs.deploy-backend.result }}"
          # Add Slack/Discord/Email notification here
```

**Required GitHub Secrets:**

```bash
# Add these secrets to your GitHub repository:
# Settings -> Secrets and variables -> Actions -> New repository secret

EC2_HOST=your-ec2-public-dns.compute.amazonaws.com
EC2_SSH_KEY=<contents of your private key>
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDFRONT_DISTRIBUTION_ID=E1234567890123
PRODUCTION_API_URL=https://your-domain.com/api
```

### Enhanced Health Check

**Comprehensive Health Check Endpoint:**

```typescript
import { Router } from "express";
import { promisify } from "util";
import { exec } from "child_process";
import logger from "./logger";

const execAsync = promisify(exec);
const healthRouter = Router();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    s3: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

interface HealthCheck {
  status: "pass" | "fail";
  message?: string;
  responseTime?: number;
}

// Database health check
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Simple query to check database connectivity
    await db.get("SELECT 1");
    return {
      status: "pass",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error("Database health check failed", { error });
    return {
      status: "fail",
      message: error.message,
    };
  }
}

// S3 health check
async function checkS3(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // List buckets to verify S3 connectivity
    await s3FileService.listObjects({ MaxKeys: 1 });
    return {
      status: "pass",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error("S3 health check failed", { error });
    return {
      status: "fail",
      message: error.message,
    };
  }
}

// Memory health check
async function checkMemory(): Promise<HealthCheck> {
  const usage = process.memoryUsage();
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentUsed = (usedMB / totalMB) * 100;

  if (percentUsed > 90) {
    return {
      status: "fail",
      message: `Memory usage critical: ${percentUsed.toFixed(1)}%`,
    };
  }

  return {
    status: "pass",
    message: `${usedMB}MB / ${totalMB}MB (${percentUsed.toFixed(1)}%)`,
  };
}

// Disk health check
async function checkDisk(): Promise<HealthCheck> {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $5}'");
    const percentUsed = parseInt(stdout.trim().replace("%", ""));

    if (percentUsed > 85) {
      return {
        status: "fail",
        message: `Disk usage critical: ${percentUsed}%`,
      };
    }

    return {
      status: "pass",
      message: `Disk usage: ${percentUsed}%`,
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Unable to check disk usage",
    };
  }
}

// Main health endpoint
healthRouter.get("/health", async (req, res) => {
  const [database, s3, memory, disk] = await Promise.all([
    checkDatabase(),
    checkS3(),
    checkMemory(),
    checkDisk(),
  ]);

  const checks = { database, s3, memory, disk };
  const allPassed = Object.values(checks).every((check) => check.status === "pass");
  const anyFailed = Object.values(checks).some((check) => check.status === "fail");

  const health: HealthStatus = {
    status: allPassed ? "healthy" : anyFailed ? "unhealthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || "unknown",
    checks,
  };

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  res.status(statusCode).json(health);
});

// Liveness probe (simple check for k8s/container orchestration)
healthRouter.get("/health/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Readiness probe
healthRouter.get("/health/ready", async (req, res) => {
  const dbCheck = await checkDatabase();
  if (dbCheck.status === "pass") {
    res.status(200).json({ status: "ready" });
  } else {
    res.status(503).json({ status: "not ready", reason: dbCheck.message });
  }
});

export default healthRouter;
```

## Rollback Strategy

### Database Backup

```bash
# Before migration, backup SQLite database
cp database.sqlite database.backup.sqlite

# Create S3 backup
aws s3 cp database.sqlite s3://your-backup-bucket/database-backup-$(date +%Y%m%d).sqlite
```

### Application Rollback

```bash
# Keep previous version available
pm2 start previous-version/dist/app.js --name "support-ticket-api-rollback"

# Switch between versions
pm2 stop support-ticket-api
pm2 start support-ticket-api-rollback
```

## Testing Strategy

### Pre-Migration Testing

1. **Local Environment**: Ensure all features work locally
2. **Environment Variables**: Test with production-like config
3. **File Upload**: Test with S3 in development
4. **API Endpoints**: Verify all endpoints respond correctly

### Post-Migration Validation

1. **Frontend Loading**: Verify React app loads from S3/CloudFront
2. **API Connectivity**: Test all API endpoints from frontend
3. **File Operations**: Upload, download, delete attachments
4. **Authentication**: Login, logout, protected routes
5. **Database Operations**: CRUD operations on all entities

## Migration Timeline

### Day 1: Infrastructure Setup (2-4 hours)

- **Morning**: AWS account setup, IAM user creation, AWS CLI configuration
- **Afternoon**: Create S3 buckets, launch EC2 instance, configure security groups

### Day 2: Code Modifications (3-5 hours)

- **Morning**: Implement S3 file service, update environment configurations
- **Afternoon**: Test S3 integration locally, update CORS settings

### Day 3: Deployment and Testing (4-6 hours)

- **Morning**: Build and deploy frontend to S3, set up CloudFront (optional)
- **Afternoon**: Deploy backend to EC2, configure PM2, end-to-end testing

### Total Migration Time: 2-3 days (9-15 hours of work)

### Optional Enhancements (Additional 1-2 days)

- Database migration to RDS
- Email notifications with SES
- Advanced monitoring with CloudWatch
- SSL certificate setup
- Custom domain configuration

## Environment Configuration Files

### Development Environment (.env.development)

```bash
# Application
NODE_ENV=development
PORT=5000
APP_VERSION=1.0.0

# Database
DATABASE_PATH=./database.sqlite

# File Storage
STORAGE_TYPE=local
UPLOAD_DIR=./uploads

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Staging Environment (.env.staging)

```bash
# Application
NODE_ENV=staging
PORT=5000
APP_VERSION=1.0.0

# Database
DATABASE_PATH=/home/ec2-user/app/database.sqlite

# AWS Configuration
AWS_REGION=us-east-1
STORAGE_TYPE=s3
S3_ATTACHMENTS_BUCKET=your-app-attachments-staging

# Authentication (use Secrets Manager in production)
JWT_SECRET=staging-secret-key-from-secrets-manager
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://staging.your-domain.com

# Logging
LOG_LEVEL=info

# CloudWatch
INSTANCE_ID=i-staging-instance-id

# Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Production Environment (.env.production)

```bash
# Application
NODE_ENV=production
PORT=5000
APP_VERSION=1.0.0

# Database
DATABASE_PATH=/home/ec2-user/app/database.sqlite

# AWS Configuration
AWS_REGION=us-east-1
STORAGE_TYPE=s3
S3_ATTACHMENTS_BUCKET=your-app-attachments-production

# Authentication (loaded from Secrets Manager)
# JWT_SECRET will be loaded from AWS Secrets Manager
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://your-domain.com

# Logging
LOG_LEVEL=warn

# CloudWatch
INSTANCE_ID=i-production-instance-id

# Rate Limiting
REDIS_HOST=your-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email (if using SES)
SES_REGION=us-east-1
FROM_EMAIL=noreply@your-domain.com
```

### Frontend Environment (.env.production for React)

```bash
# API Configuration
REACT_APP_API_URL=https://api.your-domain.com/api

# Application
REACT_APP_NAME=Support Ticket System
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CHAT=true
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. S3 Upload Fails with "Access Denied"

**Problem**: File uploads fail with S3 access denied error.

**Solution**:
```bash
# Verify IAM role is attached to EC2 instance
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].IamInstanceProfile'

# Verify IAM role has correct permissions
aws iam get-role-policy --role-name EC2-S3-Access-Role --policy-name S3AccessPolicy

# Test S3 access from EC2
aws s3 ls s3://your-app-attachments-bucket/
```

#### 2. CORS Errors in Browser

**Problem**: Frontend receives CORS errors when calling API.

**Solution**:
```typescript
// Ensure CORS middleware is before routes
app.use(cors(corsOptions));

// Verify FRONTEND_URL in environment matches actual frontend URL
console.log('Allowed origins:', process.env.FRONTEND_URL);

// Check browser console for actual vs expected origin
```

#### 3. SSL Certificate Renewal Fails

**Problem**: Let's Encrypt certificate fails to renew.

**Solution**:
```bash
# Check certbot timer status
sudo systemctl status certbot-renew.timer

# Manually test renewal
sudo certbot renew --dry-run

# Check nginx configuration
sudo nginx -t

# Verify port 80 is accessible for ACME challenge
sudo netstat -tlnp | grep :80
```

#### 4. High Memory Usage on EC2

**Problem**: Application crashes due to memory limits.

**Solution**:
```bash
# Check current memory usage
free -h

# Check PM2 logs
pm2 logs support-ticket-api

# Restart application with memory limit
pm2 delete support-ticket-api
pm2 start dist/app.js --name support-ticket-api --max-memory-restart 400M

# Consider upgrading to larger instance type
```

#### 5. Database Locked Errors

**Problem**: SQLite database locked errors under high load.

**Solution**:
```typescript
// Add busy timeout to database connection
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) throw err;
  db.run('PRAGMA busy_timeout = 5000'); // 5 seconds
  db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging
});

// Consider migrating to RDS for production
```

#### 6. CloudFront Serving Stale Content

**Problem**: Frontend updates not visible after deployment.

**Solution**:
```bash
# Create invalidation for all files
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1234567890123 \
  --id INVALIDATION_ID

# For immediate updates, use versioned file names in build
```

#### 7. PM2 Process Not Starting on Reboot

**Problem**: Application doesn't auto-start after EC2 reboot.

**Solution**:
```bash
# Generate startup script
pm2 startup

# Run the command it outputs (will be specific to your system)
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v18.0.0/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Save current PM2 process list
pm2 save

# Test reboot
sudo reboot
```

#### 8. Secrets Manager Access Denied

**Problem**: Cannot retrieve secrets from AWS Secrets Manager.

**Solution**:
```bash
# Verify IAM role has secretsmanager:GetSecretValue permission
aws iam get-role-policy --role-name EC2-S3-Access-Role --policy-name SecretsManagerPolicy

# Test secret retrieval
aws secretsmanager get-secret-value --secret-id prod/support-ticket/api

# Check CloudWatch logs for detailed error
aws logs tail /aws/ec2/support-ticket-api --follow
```

## Quick Reference Implementation Checklist

### Pre-Migration Preparation

- [ ] Create AWS account and set up billing alerts
- [ ] Create IAM user with programmatic access
- [ ] Install and configure AWS CLI locally
- [ ] Backup current database and uploads directory
- [ ] Document current environment variables
- [ ] Test application locally to ensure it works

### AWS Infrastructure Setup

- [ ] Create VPC with public subnet
- [ ] Create Internet Gateway and route table
- [ ] Create security group with proper rules
- [ ] Launch EC2 instance (t3.micro)
- [ ] Create and attach IAM role to EC2
- [ ] Create S3 bucket for frontend
- [ ] Create S3 bucket for attachments
- [ ] Enable S3 bucket encryption
- [ ] Configure S3 bucket policies
- [ ] Create S3 bucket for database backups
- [ ] Create CloudFront distribution (optional)
- [ ] Create AWS Secrets Manager secret
- [ ] Set up CloudWatch log groups

### Code Modifications

- [ ] Implement S3FileService class
- [ ] Implement LocalFileService class
- [ ] Create FileService factory pattern
- [ ] Update Multer configuration for S3
- [ ] Add CORS middleware configuration
- [ ] Implement Winston logger
- [ ] Add Secrets Manager integration
- [ ] Implement rate limiting middleware
- [ ] Create comprehensive health check endpoint
- [ ] Update environment variable handling
- [ ] Add error handling for S3 operations
- [ ] Test file upload/download locally with S3

### Backend Deployment

- [ ] SSH into EC2 instance
- [ ] Install Node.js (via nvm)
- [ ] Install PM2 globally
- [ ] Install Nginx
- [ ] Configure Nginx as reverse proxy
- [ ] Upload backend code to EC2
- [ ] Install dependencies (`npm ci --production`)
- [ ] Build TypeScript code (`npm run build`)
- [ ] Create production .env file
- [ ] Start application with PM2
- [ ] Configure PM2 startup script
- [ ] Test API endpoints from EC2

### SSL/HTTPS Setup

- [ ] Point domain to EC2 public IP
- [ ] Install Certbot
- [ ] Obtain SSL certificate
- [ ] Configure Nginx for HTTPS
- [ ] Set up auto-renewal
- [ ] Test HTTPS access
- [ ] Configure HTTP to HTTPS redirect

### Frontend Deployment

- [ ] Update frontend API URL
- [ ] Build React application (`npm run build`)
- [ ] Upload build to S3 frontend bucket
- [ ] Configure S3 for static website hosting
- [ ] Set up CloudFront distribution (optional)
- [ ] Test frontend access
- [ ] Test API connectivity from frontend

### Monitoring and Logging

- [ ] Install CloudWatch agent on EC2
- [ ] Configure CloudWatch metrics collection
- [ ] Create CloudWatch alarms (CPU, memory, disk, errors)
- [ ] Set up SNS topic for alerts
- [ ] Verify logs are being sent to CloudWatch
- [ ] Test alarm notifications

### Database Backup

- [ ] Create backup script
- [ ] Test backup script manually
- [ ] Set up cron job for automated backups
- [ ] Verify backups are uploaded to S3
- [ ] Test database restore procedure
- [ ] Document restore process

### CI/CD Setup (Optional)

- [ ] Create GitHub Actions workflow file
- [ ] Add required secrets to GitHub repository
- [ ] Test workflow with manual trigger
- [ ] Verify automated deployment works
- [ ] Set up deployment notifications

### Post-Deployment Validation

- [ ] Test user registration and login
- [ ] Test ticket creation
- [ ] Test file upload to S3
- [ ] Test file download from S3
- [ ] Test file deletion
- [ ] Verify all API endpoints work
- [ ] Check CloudWatch logs for errors
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Test from different geographic locations
- [ ] Verify SSL certificate is valid
- [ ] Test CORS from frontend
- [ ] Verify rate limiting works
- [ ] Check database backup was created

### Security Audit

- [ ] Verify S3 buckets have correct permissions
- [ ] Confirm secrets are in Secrets Manager (not .env)
- [ ] Check security group rules are minimal
- [ ] Verify SSH access is restricted to your IP
- [ ] Confirm HTTPS is enforced
- [ ] Test rate limiting on auth endpoints
- [ ] Verify file upload size limits
- [ ] Check file type validation
- [ ] Review CloudWatch logs for suspicious activity

### Documentation

- [ ] Document deployment process
- [ ] Create runbook for common operations
- [ ] Document rollback procedure
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Document backup and restore procedures

## Success Metrics

### Performance Targets

- **Frontend Load Time**: < 3 seconds globally
- **API Response Time**: < 500ms for most endpoints
- **File Upload**: < 30 seconds for 10MB files
- **Uptime**: > 99.9% availability

### Cost Targets

- **Monthly AWS Bill**: < $20 for small usage
- **Data Transfer**: Optimize to stay within free tier
- **Storage**: Implement lifecycle policies for old files

## Benefits of Phase 2 Migration

### Technical Benefits

- **Scalability**: Auto-scaling capabilities
- **Reliability**: 99.99% uptime SLA
- **Performance**: Global CDN distribution
- **Security**: AWS security best practices
- **Backup**: Automated backup solutions

### Business Benefits

- **Professional Deployment**: Production-ready application
- **Global Accessibility**: Worldwide user access
- **Cost Efficiency**: Pay-as-you-use pricing
- **Maintenance**: Managed services reduce overhead
- **Compliance**: AWS compliance certifications

This Phase 2 migration transforms the local development application into a professional, scalable, production-ready system that demonstrates real-world cloud deployment skills and enterprise-level architecture understanding.
