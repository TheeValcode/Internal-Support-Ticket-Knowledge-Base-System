# AWS Application Update Guide

This guide explains how to update your deployed application. You have three main options, ranging from manual to fully automated.

---

## Option 1: Manual Upload (What we did today)
**Best for:** Quick fixes without using Git.

1.  **Local:** Zip your project (`tar -czf project.tar.gz ...`).
2.  **Local:** Upload to server (`scp ...`).
3.  **Server:** Unzip, install dependencies, build, and restart PM2.

*(See `Frontend-Deployment-Guide.md` for the exact commands)*

---

## Option 2: Git Pull (Recommended for now)
**Best for:** Simple updates if your code is on GitHub.

**Prerequisites:**
*   Your code must be pushed to a GitHub repository.
*   The server needs permission to pull from your repo (public repo or SSH key).

### Steps:

1.  **Push changes to GitHub** from your local computer:
    ```bash
    git add .
    git commit -m "Update feature X"
    git push origin main
    ```

2.  **SSH into your server:**
    ```bash
    ssh -i ~/.ssh/support-ticket-key.pem ec2-user@YOUR_IP
    ```

3.  **Pull and Rebuild:**
    ```bash
    cd app
    
    # 1. Get latest code
    git pull origin main
    
    # 2. Re-install dependencies (if package.json changed)
    npm install
    cd frontend && npm install && cd ../server && npm install
    
    # 3. Re-build Frontend
    cd ../frontend
    npm run build
    
    # 4. Re-build Backend
    cd ../server
    npm run build
    
    # 5. Restart App
    pm2 restart support-ticket
    ```

---

## Option 3: GitHub Actions (Fully Automated)
**Best for:** "Push and forget". When you push to GitHub, it automatically updates the server.

**How it works:**
1.  You create a `.github/workflows/deploy.yml` file in your repo.
2.  GitHub Actions listens for pushes to the `main` branch.
3.  When you push, GitHub connects to your EC2 instance (using secrets you save in GitHub) and runs the update commands automatically.

### Example Workflow File (`deploy.yml`)

```yaml
name: Deploy to AWS
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_KEY }}
        script: |
          cd app
          git pull origin main
          # Install & Build Frontend
          cd frontend
          npm install
          npm run build
          # Install & Build Backend
          cd ../server
          npm install
          npm run build
          # Restart
          pm2 restart support-ticket
```

**To set this up, you would need to:**
1.  Add your EC2 IP (`EC2_HOST`) and Private Key (`EC2_KEY`) to GitHub Repository Secrets.
2.  Add the `deploy.yml` file to your project.
