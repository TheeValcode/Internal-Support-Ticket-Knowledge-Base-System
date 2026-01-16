# AWS Code Deployment Guide

**Prerequisites:** ✅ Infrastructure setup complete (EC2 running)

This guide will help you install Node.js on your server and deploy your application code.

---

## Step 1: Connect to Your Server

Open your terminal and run:

```bash
# Load your config if not already loaded
source .aws/deployment-config.sh

# SSH into the server
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP
```

**Note:** You are now inside the remote server! The prompt should look like `[ec2-user@ip-172-31-xx-xx ~]$`.

---

## Step 2: Install Software (Node.js & PM2)

Run these commands **inside the server**:

```bash
# 1. Install Node.js (Version 18)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 18

# 2. Install Git
sudo yum install git -y

# 3. Install PM2 (Process Manager to keep app running)
npm install -g pm2

# 4. Verify installations
node -v
npm -v
pm2 -v
```

---

## Step 3: Copy Your Code

You have two options. **Option A** is easier if you have your code on GitHub. **Option B** uploads directly from your computer.

### Option A: Git Clone (Recommended)

```bash
# Inside the server:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git app
cd app
npm install
```

### Option B: Upload from Local Computer

**Open a NEW terminal window on your computer** (don't close the SSH one) and run:

```bash
# Load config
source .aws/deployment-config.sh

# Zip your project (excluding node_modules)
# Make sure you are in your project root folder
tar -czf project.tar.gz --exclude=node_modules --exclude=.git .

# Upload to server
scp -i $SSH_KEY project.tar.gz ec2-user@$PUBLIC_IP:~

# Go back to your SSH window and run:
mkdir app
tar -xzf project.tar.gz -C app
cd app
npm install
```

---

## Step 4: Configure Environment Variables

Create the `.env` file inside your app folder on the server:

```bash
# Inside the server, in the 'app' folder:
nano .env
```

Paste this content (Right-click to paste):

```env
# Server Config
PORT=80
NODE_ENV=production

# AWS Config (We use the instance role, so no keys needed!)
AWS_REGION=us-east-1
STORAGE_TYPE=s3
S3_ATTACHMENTS_BUCKET=YOUR_BUCKET_NAME_HERE  # <--- Replace this!

# Database
DATABASE_PATH=./database.sqlite

# Security
JWT_SECRET=change_this_to_something_random
FRONTEND_URL=*
```

*   **Tip:** To find your bucket name, run `aws s3 ls` inside the server.
*   Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit.

---

## Step 5: Start the Application

We need to allow Node.js to use Port 80 (HTTP):

```bash
# Allow node to bind to port 80
sudo setcap cap_net_bind_service=+ep $(eval readlink -f `which node`)

# Start the app with PM2
pm2 start src/index.js --name "support-ticket"

# Save the process list so it restarts on reboot
pm2 save
pm2 startup
# (Run the command output by pm2 startup)
```

---

## Step 6: Verify It Works!

Open your browser and visit:
`http://YOUR_SERVER_IP`

(e.g., `http://98.93.248.141`)

You should see your application running! 🎉

---

## 🔧 Troubleshooting

*   **App not loading?**
    *   Check logs: `pm2 logs support-ticket`
    *   Ensure Security Group allows Port 80 (we did this earlier).
*   **Database errors?**
    *   Ensure `database.sqlite` exists or is created by the app.
*   **Permission denied?**
    *   Run `sudo chmod -R 755 .` in the app folder.
