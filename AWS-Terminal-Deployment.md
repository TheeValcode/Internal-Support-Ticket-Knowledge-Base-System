# AWS Simple Deployment Guide - Terminal Commands

**Prerequisites:** ✅ AWS account created, ✅ IAM user configured, ✅ AWS CLI installed and configured

This is a **simplified, beginner-friendly** deployment guide that gets your app running on AWS in **5-10 minutes**.

**What we're skipping (for simplicity):**
- Custom VPC (using AWS default VPC instead)
- Elastic IP (using auto-assigned public IP)
- Secrets Manager (using .env file instead)
- Separate frontend S3 bucket (serving from EC2)
- CloudWatch alarms (manual monitoring)

You can always add these later as you learn more!

---

## Step 1: Verify AWS CLI Configuration

```bash
# Verify AWS CLI is properly configured
aws sts get-caller-identity

# Expected output should show your UserId, Account, and Arn
# If this fails, run: aws configure
```

**Set environment variables:**

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Set your project name
export PROJECT_NAME=support-ticket

# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "✅ AWS Region: $AWS_REGION"
echo "✅ Project Name: $PROJECT_NAME"
echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"
```

---

## Step 2: Create SSH Key Pair

```bash
# Create SSH key pair for EC2 access
aws ec2 create-key-pair \
  --key-name ${PROJECT_NAME}-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/${PROJECT_NAME}-key.pem

# Set correct permissions
chmod 400 ~/.ssh/${PROJECT_NAME}-key.pem

echo "✅ SSH key created: ~/.ssh/${PROJECT_NAME}-key.pem"
```

---

## Step 3: Create Security Group

```bash
# Get default VPC ID (AWS creates this automatically)
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "✅ Using default VPC: $VPC_ID"

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-sg \
  --description "Security group for Support Ticket application" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

echo "✅ Security group created: $SECURITY_GROUP_ID"

# Get your current public IP for SSH access
MY_IP=$(curl -s https://checkip.amazonaws.com)
echo "✅ Your public IP: $MY_IP"

# Allow SSH from your IP only
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 22 \
  --cidr ${MY_IP}/32

# Allow HTTP (for Let's Encrypt and web access)
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS (for production traffic)
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

echo "✅ Security group rules configured"
```

---

## Step 4: Create S3 Bucket for Attachments

```bash
# Create attachments bucket with unique name
ATTACHMENTS_BUCKET="${PROJECT_NAME}-attachments-$(date +%s)"
aws s3 mb s3://${ATTACHMENTS_BUCKET} --region $AWS_REGION

echo "✅ Attachments bucket created: $ATTACHMENTS_BUCKET"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $ATTACHMENTS_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access (files will be accessed via signed URLs)
aws s3api put-public-access-block \
  --bucket $ATTACHMENTS_BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ S3 bucket configured with encryption"
```

---

## Step 5: Create IAM Role for EC2

```bash
# Create trust policy
cat > /tmp/ec2-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name ${PROJECT_NAME}-ec2-role \
  --assume-role-policy-document file:///tmp/ec2-trust-policy.json

echo "✅ IAM role created"

# Create permissions policy for S3 access
cat > /tmp/ec2-permissions.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::${ATTACHMENTS_BUCKET}",
      "arn:aws:s3:::${ATTACHMENTS_BUCKET}/*"
    ]
  }]
}
EOF

# Attach policy to role
aws iam put-role-policy \
  --role-name ${PROJECT_NAME}-ec2-role \
  --policy-name S3Access \
  --policy-document file:///tmp/ec2-permissions.json

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-instance-profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-instance-profile \
  --role-name ${PROJECT_NAME}-ec2-role

echo "✅ IAM permissions configured"
echo "⏳ Waiting 10 seconds for IAM propagation..."
sleep 10
```

---

## Step 6: Launch EC2 Instance

```bash
# Get latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" \
            "Name=state,Values=available" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

echo "✅ Using AMI: $AMI_ID"

# Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name ${PROJECT_NAME}-key \
  --security-group-ids $SECURITY_GROUP_ID \
  --iam-instance-profile Name=${PROJECT_NAME}-instance-profile \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-server}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "✅ EC2 instance launching: $INSTANCE_ID"
echo "⏳ Waiting for instance to be running (this takes ~30 seconds)..."

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ Instance is running!"
echo "✅ Public IP: $PUBLIC_IP"
```

---

## Step 7: Save Configuration

```bash
# Create configuration file
mkdir -p .aws
cat > .aws/deployment-config.sh << EOF
#!/bin/bash
# AWS Deployment Configuration
# Generated on $(date)

export AWS_REGION=$AWS_REGION
export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
export PROJECT_NAME=$PROJECT_NAME
export VPC_ID=$VPC_ID
export SECURITY_GROUP_ID=$SECURITY_GROUP_ID
export ATTACHMENTS_BUCKET=$ATTACHMENTS_BUCKET
export INSTANCE_ID=$INSTANCE_ID
export PUBLIC_IP=$PUBLIC_IP
export SSH_KEY=~/.ssh/${PROJECT_NAME}-key.pem

echo "✅ Configuration loaded!"
echo "Instance IP: \$PUBLIC_IP"
echo "SSH: ssh -i \$SSH_KEY ec2-user@\$PUBLIC_IP"
EOF

chmod +x .aws/deployment-config.sh

echo "✅ Configuration saved to .aws/deployment-config.sh"
```

---

## Step 8: Test SSH Connection

```bash
echo "⏳ Waiting 60 seconds for instance to fully initialize..."
sleep 60

echo "Testing SSH connection..."
ssh -i ~/.ssh/${PROJECT_NAME}-key.pem \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    ec2-user@$PUBLIC_IP "echo '✅ SSH connection successful!'"

if [ $? -eq 0 ]; then
    echo "✅ Ready to deploy!"
else
    echo "⚠️  SSH not ready yet. Wait 30 more seconds and try:"
    echo "ssh -i ~/.ssh/${PROJECT_NAME}-key.pem ec2-user@$PUBLIC_IP"
fi
```

---

## 🎉 Deployment Complete!

```bash
echo ""
echo "========================================="
echo "🎉 AWS Infrastructure Setup Complete!"
echo "========================================="
echo ""
echo "📋 Your Resources:"
echo "  EC2 Instance:       $INSTANCE_ID"
echo "  Public IP:          $PUBLIC_IP"
echo "  S3 Bucket:          $ATTACHMENTS_BUCKET"
echo "  Security Group:     $SECURITY_GROUP_ID"
echo ""
echo "🔑 SSH Access:"
echo "  ssh -i ~/.ssh/${PROJECT_NAME}-key.pem ec2-user@$PUBLIC_IP"
echo ""
echo "📝 Next Steps:"
echo "  1. SSH into your server"
echo "  2. Install Node.js, PM2, and Nginx"
echo "  3. Deploy your application code"
echo "  4. Configure environment variables"
echo "  5. Set up SSL with Let's Encrypt (optional)"
echo ""
echo "💾 Configuration saved to: .aws/deployment-config.sh"
echo "   Load anytime with: source .aws/deployment-config.sh"
echo ""
echo "💰 Estimated Monthly Cost: ~\$8-10 (or FREE with free tier)"
echo ""
```

---

## 📝 Environment Variables for Your App

Create this `.env` file on your EC2 instance:

```bash
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_PATH=/home/ec2-user/app/database.sqlite

# AWS S3
STORAGE_TYPE=s3
AWS_REGION=us-east-1
S3_ATTACHMENTS_BUCKET=your-attachments-bucket-name

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://your-public-ip
```

**Note:** Replace `your-attachments-bucket-name` with your actual bucket name (saved in config).

---

## 🔧 Troubleshooting

### SSH Connection Fails

```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID

# Verify your IP hasn't changed
echo "Current IP: $(curl -s https://checkip.amazonaws.com)"
echo "Allowed IP: $MY_IP"

# If IP changed, update security group:
NEW_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 revoke-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 22 --cidr ${MY_IP}/32

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp --port 22 --cidr ${NEW_IP}/32
```

### View All Resources

```bash
# Load configuration
source .aws/deployment-config.sh

# Check EC2 instance
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress]' \
  --output table

# Check S3 bucket
aws s3 ls s3://$ATTACHMENTS_BUCKET

# Check security group
aws ec2 describe-security-groups --group-ids $SECURITY_GROUP_ID
```

### Get Current Public IP

```bash
# If you stopped/started your instance, get new IP:
source .aws/deployment-config.sh
NEW_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "New Public IP: $NEW_IP"

# Update config file
sed -i "s/PUBLIC_IP=.*/PUBLIC_IP=$NEW_IP/" .aws/deployment-config.sh
```

---

## 🗑️ Clean Up (Delete Everything)

**⚠️ WARNING: This will delete all resources!**

```bash
# Load configuration
source .aws/deployment-config.sh

# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
echo "⏳ Waiting for instance to terminate..."
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID

# Delete S3 bucket (must be empty)
aws s3 rb s3://$ATTACHMENTS_BUCKET --force

# Delete security group
aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID

# Delete IAM resources
aws iam remove-role-from-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-instance-profile \
  --role-name ${PROJECT_NAME}-ec2-role

aws iam delete-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-instance-profile

aws iam delete-role-policy \
  --role-name ${PROJECT_NAME}-ec2-role \
  --policy-name S3Access

aws iam delete-role --role-name ${PROJECT_NAME}-ec2-role

# Delete SSH key
aws ec2 delete-key-pair --key-name ${PROJECT_NAME}-key
rm ~/.ssh/${PROJECT_NAME}-key.pem

# Clean up temp files
rm -f /tmp/ec2-trust-policy.json /tmp/ec2-permissions.json

echo "✅ All resources deleted"
```

---

## 💡 Tips for Beginners

1. **IP Address Changes**: Your public IP will change if you stop/start the instance. Use the troubleshooting section to get the new IP.

2. **Free Tier**: t3.micro gives you 750 hours/month free for 12 months. Don't leave it running 24/7 after testing!

3. **Costs**: If you go over free tier, expect ~$8-10/month for this setup.

4. **Backups**: Manually backup your database regularly:
   ```bash
   scp -i ~/.ssh/${PROJECT_NAME}-key.pem \
     ec2-user@$PUBLIC_IP:/home/ec2-user/app/database.sqlite \
     ./backup-$(date +%Y%m%d).sqlite
   ```

5. **Monitoring**: Check your AWS billing dashboard weekly to avoid surprises.

6. **Security**: Change the JWT_SECRET to something secure (use `openssl rand -base64 32`).

---

## 🚀 What's Next?

After infrastructure is set up, you'll need to:
1. **Configure EC2** - Install Node.js, PM2, Nginx
2. **Deploy Backend** - Upload and run your Express API
3. **Deploy Frontend** - Serve your React app
4. **Set up SSL** - Get HTTPS working (optional but recommended)

Would you like a guide for these next steps?
