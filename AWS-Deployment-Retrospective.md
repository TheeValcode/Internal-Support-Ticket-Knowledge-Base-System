# AWS Deployment Retrospective: Support Ticket System

**Date:** January 16, 2026
**Project:** Support Ticket System
**Objective:** Deploy the full-stack Node.js/React application to AWS EC2 with S3 storage.

---

## 🚀 Executive Summary

We successfully migrated the Support Ticket System from a local development environment to a live AWS production environment. The application is now accessible via a public IP address, serving both the React frontend and Node.js backend from a single EC2 instance, with file attachments securely stored in S3.

## 🏗️ Architecture Implemented

*   **Compute:** AWS EC2 (t3.micro) running Amazon Linux 2023.
*   **Storage:** AWS S3 for persistent file storage (ticket attachments).
*   **Process Management:** PM2 for keeping the application alive and handling restarts.
*   **Web Server:** Node.js directly serving traffic on Port 80 (HTTP).
*   **Security:** IAM Roles for secure S3 access (no hardcoded keys), Security Groups acting as a firewall.

---

## 🏆 Key Achievements

1.  **Infrastructure as Code (Light):** Used AWS CLI commands to provision resources, making the process reproducible.
2.  **Full Stack Deployment:** Configured the backend to serve the compiled React frontend, eliminating the need for a separate web server (like Nginx) for this initial phase.
3.  **Production Hardening:**
    *   Configured **PM2** to auto-start on server reboot.
    *   Enabled **Port 80** binding without running as root (using `setcap`).
    *   Optimized **TypeScript** build process for production.

---

## ⚔️ Challenges & Solutions

During the deployment, we encountered several real-world hurdles. Here is how we overcame them:

| Challenge | Root Cause | Solution |
| :--- | :--- | :--- |
| **Terminal Freezing** | Network instability or session timeouts caused the SSH connection to hang. | **Restored Session:** Created a `deployment-config.sh` script to quickly restore environment variables (IP, IDs) in new terminal sessions. |
| **Missing Build Tools** | The `better-sqlite3` database driver requires compilation (C++), but the minimal server image lacked `make` and `gcc`. | **Installed Dev Tools:** Ran `sudo yum groupinstall "Development Tools"` to provide the necessary compilers. |
| **Frontend Build Failures** | TypeScript was configured to be too strict (`noUnusedLocals`), failing the build on minor code style issues. | **Relaxed Config:** Modified `tsconfig.json` on the server to disable strict unused variable checks for the build. |
| **Node.js Version Mismatch** | Vite (Frontend build tool) required Node.js 20+, but we initially installed Node.js 18. | **Upgraded Node:** Installed Node 20 via NVM, updated aliases, and re-installed global packages. |
| **App Crash Loop (Version)** | After upgrading Node, the C++ addons (sqlite) were compiled for the old version, causing crashes. | **Rebuild & Reinstall:** Uninstalled PM2, cleared `node_modules`, and ran `npm rebuild` to re-compile all binary addons for Node 20. |
| **Port Binding Permission** | Upgrading Node replaced the binary, losing the permission to bind to Port 80. | **Re-granted Capabilities:** Ran `sudo setcap cap_net_bind_service=+ep ...` on the new Node binary. |
| **Routing Error** | Express v5 handles wildcard routes (`*`) differently than v4, causing a crash on the catch-all route. | **Regex Route:** Updated the route path from string `'*'` to regex `/(.*)/` for Express 5. |
| **Browser Blocking (HSTS)** | The app's security middleware (`Helmet`) was forcing HTTPS, but we haven't set up SSL yet, causing "Connection Refused". | **Disabled HSTS:** Modified `app.ts` to disable HSTS and Content Security Policy (CSP) in Helmet, allowing HTTP access. |

---

## 🌟 Significance

This deployment is a major milestone because:
*   **Accessibility:** The application is no longer trapped on a local laptop; it can be accessed by anyone with the IP address.
*   **Persistence:** By moving attachments to S3, we ensured that files are safe even if the server is terminated or replaced.
*   **Scalability Foundation:** We now have a "Golden Image" setup. We could snapshot this server and launch 10 more identical copies if traffic spikes.

## 🔮 Future Improvements

To make this deployment "Enterprise Grade," the next steps would be:
1.  **Domain Name:** Purchase a domain (e.g., `mysupportapp.com`) instead of using a raw IP.
2.  **SSL/HTTPS:** Use Certbot/Let's Encrypt to secure the connection (essential for user trust).
3.  **CI/CD Pipeline:** Automate the "Zip -> Upload -> Build" process using GitHub Actions so deployment happens automatically on push.
