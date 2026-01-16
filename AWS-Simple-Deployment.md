# AWS Simple Deployment - Beginner's Guide

**Perfect for:** First-time AWS users, learning projects, portfolio apps

**Time to complete:** 5-10 minutes

**Monthly cost:** FREE (with free tier) or ~$8-10/month

---

## What You'll Get

- ✅ Running web server on AWS
- ✅ File storage with S3
- ✅ Secure SSH access
- ✅ Public IP address for your app

## What We're NOT Doing (To Keep It Simple)

- ❌ Custom VPC (using AWS default)
- ❌ Static IP (your IP changes if you stop/start)
- ❌ Separate frontend hosting (everything on one server)
- ❌ Advanced monitoring (check manually)
- ❌ Secrets Manager (using .env file)

You can add these later as you learn!

---

## Prerequisites

```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# If this fails, run: aws configure
```

---

## 🚀 Quick Start (Copy-Paste All Commands)

### Set Variables

```bash
export AWS_REGION=us-east-1
export PROJECT_NAME=support-ticket
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

### Create SSH Key

```bash
aws ec2 create-key-pair \
  --key-name ${PROJECT_NAME}-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/${PROJECT_NAME}-key.pem

chmod 400 ~/.ssh/${PROJECT_NAME}-key.pem
```

### Create Security Group

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-sg \
  --description "Security group for ${PROJECT_NAME}" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

MY_IP=$(curl -s https://checkip.amazonaws.com)

aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr ${MY_IP}/32
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### Create S3 Bucket

```bash
ATTACHMENTS_BUCKET="${PROJECT_NAME}-attachments-$(date +%s)"
aws s3 mb s3://${ATTACHMENTS_BUCKET} --region $AWS_REGION

aws s3api put-bucket-encryption \
  --bucket $ATTACHMENTS_BUCKET \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket $ATTACHMENTS_BUCKET \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Create IAM Role

```bash
cat > /tmp/trust.json << 'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF

aws iam create-role --role-name ${PROJECT_NAME}-ec2-role --assume-role-policy-document file:///tmp/trust.json

cat > /tmp/perms.json << EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket"],"Resource":["arn:aws:s3:::${ATTACHMENTS_BUCKET}","arn:aws:s3:::${ATTACHMENTS_BUCKET}/*"]}]}
EOF

aws iam put-role-policy --role-name ${PROJECT_NAME}-ec2-role --policy-name S3Access --policy-document file:///tmp/perms.json

aws iam create-instance-profile --instance-profile-name ${PROJECT_NAME}-instance-profile
aws iam add-role-to-instance-profile --instance-profile-name ${PROJECT_NAME}-instance-profile --role-name ${PROJECT_NAME}-ec2-role

sleep 10
```

### Launch EC2 Instance

```bash
AMI_ID=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" --query 'Images|sort_by(@,&CreationDate)|[-1].ImageId' --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name ${PROJECT_NAME}-key \
  --security-group-ids $SECURITY_GROUP_ID \
  --iam-instance-profile Name=${PROJECT_NAME}-instance-profile \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-server}]" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
```

### Save Configuration

```bash
mkdir -p .aws
cat > .aws/deployment-config.sh << EOF
export AWS_REGION=$AWS_REGION
export PROJECT_NAME=$PROJECT_NAME
export ATTACHMENTS_BUCKET=$ATTACHMENTS_BUCKET
export INSTANCE_ID=$INSTANCE_ID
export PUBLIC_IP=$PUBLIC_IP
export SECURITY_GROUP_ID=$SECURITY_GROUP_ID
export SSH_KEY=~/.ssh/${PROJECT_NAME}-key.pem
EOF

chmod +x .aws/deployment-config.sh
```

### Test Connection

```bash
echo "Waiting 60 seconds for instance to initialize..."
sleep 60

ssh -i ~/.ssh/${PROJECT_NAME}-key.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "echo 'Connected!'"
```

---

## ✅ Done!

```bash
echo "========================================="
echo "🎉 AWS Setup Complete!"
echo "========================================="
echo ""
echo "Your Server IP: $PUBLIC_IP"
echo "S3 Bucket: $ATTACHMENTS_BUCKET"
echo ""
echo "SSH Command:"
echo "ssh -i ~/.ssh/${PROJECT_NAME}-key.pem ec2-user@$PUBLIC_IP"
echo ""
echo "Config saved to: .aws/deployment-config.sh"
echo "Load with: source .aws/deployment-config.sh"
```

---

## 📝 Next Steps

1. **SSH into your server:**
   ```bash
   ssh -i ~/.ssh/${PROJECT_NAME}-key.pem ec2-user@$PUBLIC_IP
   ```

2. **Install Node.js:**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   ```

3. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

4. **Deploy your app** (upload code, install dependencies, start with PM2)

---

## 🔧 Common Issues

### SSH Doesn't Work

```bash
# Your IP might have changed
source .aws/deployment-config.sh
NEW_IP=$(curl -s https://checkip.amazonaws.com)

# Update security group
aws ec2 revoke-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr ${MY_IP}/32
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr ${NEW_IP}/32
```

### Get New Public IP (After Stop/Start)

```bash
source .aws/deployment-config.sh
NEW_PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "New IP: $NEW_PUBLIC_IP"
```

---

## 🗑️ Delete Everything

```bash
source .aws/deployment-config.sh

# Terminate instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID

# Delete S3 bucket
aws s3 rb s3://$ATTACHMENTS_BUCKET --force

# Delete security group
aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID

# Delete IAM
aws iam remove-role-from-instance-profile --instance-profile-name ${PROJECT_NAME}-instance-profile --role-name ${PROJECT_NAME}-ec2-role
aws iam delete-instance-profile --instance-profile-name ${PROJECT_NAME}-instance-profile
aws iam delete-role-policy --role-name ${PROJECT_NAME}-ec2-role --policy-name S3Access
aws iam delete-role --role-name ${PROJECT_NAME}-ec2-role

# Delete SSH key
aws ec2 delete-key-pair --key-name ${PROJECT_NAME}-key
rm ~/.ssh/${PROJECT_NAME}-key.pem

echo "✅ All deleted"
```

---

## 💡 Tips

- **Free Tier:** 750 hours/month free for 12 months (t3.micro)
- **Stop Instance:** Stop when not using to save money
- **Backups:** Download database regularly with `scp`
- **Monitoring:** Check AWS billing dashboard weekly
- **IP Changes:** Public IP changes when you stop/start (use Elastic IP to fix this)

---

## 🚀 Ready to Deploy?

You now have:
- ✅ A running server
- ✅ File storage
- ✅ Secure access

Next: Install your application and go live!
