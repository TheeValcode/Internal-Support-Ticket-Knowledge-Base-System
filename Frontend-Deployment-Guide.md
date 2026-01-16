# Frontend Deployment Guide

**Prerequisites:** ✅ Backend running on Port 80

This guide will help you deploy your React frontend so it is served by your backend server.

---

## Step 1: Prepare & Upload Code (Local Machine)

Since we modified the server code to serve the frontend, we need to upload the project again.

**Open a NEW terminal on your computer** (not the SSH one) and run:

```bash
# 1. Load config
source .aws/deployment-config.sh

# 2. Re-zip the project
# (Make sure you are in the project root folder!)
tar -czf project.tar.gz --exclude=node_modules --exclude=.git .

# 3. Upload to server
scp -i $SSH_KEY project.tar.gz ec2-user@$PUBLIC_IP:~
```

---

## Step 2: Unzip & Build Frontend (Server)

**Go to your SSH terminal** (connected to EC2) and run:

```bash
# 1. Unzip the new code
tar -xzf project.tar.gz -C app

# 2. Go to frontend folder
cd app/frontend

# 3. Configure API URL (Relative path avoids CORS issues!)
echo "VITE_API_URL=/api" > .env

# 4. Install dependencies & Build
npm install
npm run build
```

*This might take 1-2 minutes.*

---

## Step 3: Re-Build Backend (Server)

We need to re-compile the backend because we changed `app.ts` to serve the frontend files.

```bash
# 1. Go to server folder
cd ../server

# 2. Re-build backend
npm run build

# 3. Restart the app
pm2 restart support-ticket
```

---

## Step 4: Verify Deployment

Open your browser and visit your public IP:

👉 **http://YOUR_PUBLIC_IP**
(e.g., `http://98.93.248.141`)

You should now see your React application! 🎉

---

## 🔧 Troubleshooting

*   **White screen?**
    *   Check console for errors (F12).
    *   Ensure `VITE_API_URL=/api` was set correctly.
*   **404 on refresh?**
    *   Our `app.ts` change (`app.get('*', ...)`) handles this, so it should work!
*   **"Internal Server Error"?**
    *   Check backend logs: `pm2 logs support-ticket`
