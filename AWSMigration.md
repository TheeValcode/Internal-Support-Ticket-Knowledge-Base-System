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
const API_BASE_URL = 'http://localhost:5000/api';

// After: Production API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-ec2-domain.com/api';
```

#### Backend Changes - File Service Migration

**Current Local File Service:**
```typescript
class LocalFileService {
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const filePath = path.join('./uploads', filename);
    await fs.writeFile(filePath, file);
    return `/uploads/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const filePath = path.join('./uploads', filename);
    return await fs.readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join('./uploads', filename);
    await fs.unlink(filePath);
  }
}
```

**New S3 File Service:**
```typescript
import AWS from 'aws-sdk';

class S3FileService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.bucketName = process.env.S3_ATTACHMENTS_BUCKET!;
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
      Body: file,
      ContentType: 'application/octet-stream'
    };
    
    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const params = {
      Bucket: this.bucketName,
      Key: filename
    };
    
    const result = await this.s3.getObject(params).promise();
    return result.Body as Buffer;
  }

  async deleteFile(filename: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: filename
    };
    
    await this.s3.deleteObject(params).promise();
  }

  // Generate pre-signed URLs for secure direct downloads
  getSignedDownloadUrl(filename: string): string {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucketName,
      Key: filename,
      Expires: 3600 // 1 hour
    });
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

### IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-app-attachments-bucket/*"
    }
  ]
}
```

### EC2 Security Groups
- **Inbound Rules**:
  - HTTP (80) from 0.0.0.0/0
  - HTTPS (443) from 0.0.0.0/0
  - SSH (22) from your IP only
- **Outbound Rules**:
  - All traffic to 0.0.0.0/0 (for API calls, updates)

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

## Monitoring and Maintenance

### CloudWatch Integration
```typescript
// Add CloudWatch logging to Express app
import AWS from 'aws-sdk';

const cloudWatchLogs = new AWS.CloudWatchLogs({
  region: process.env.AWS_REGION
});

// Log application events
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Health Checks
```typescript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
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

### Week 1: Infrastructure Setup
- Day 1-2: AWS account setup, IAM configuration
- Day 3-4: S3 buckets, EC2 instance creation
- Day 5-7: Security groups, networking configuration

### Week 2: Code Modifications
- Day 1-3: Implement S3 file service
- Day 4-5: Update environment configurations
- Day 6-7: Testing with AWS services locally

### Week 3: Deployment and Testing
- Day 1-2: Deploy frontend to S3
- Day 3-4: Deploy backend to EC2
- Day 5-7: End-to-end testing, performance optimization

### Week 4: Production Readiness
- Day 1-2: Monitoring setup, logging
- Day 3-4: Backup strategies, security review
- Day 5-7: Documentation, handover

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