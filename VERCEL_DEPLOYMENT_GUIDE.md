# HRMS Vercel Deployment Guide

## 🏗️ Architecture Overview

This HRMS uses a **hybrid deployment architecture**:

```
┌─────────────────────────────────────────────────┐
│                   VERCEL CLOUD                   │
│  ┌────────────────────────────────────────────┐ │
│  │      Next.js Frontend (Static + SSR)       │ │
│  │   https://your-hrms.vercel.app             │ │
│  └────────────┬───────────────────────────────┘ │
└───────────────┼─────────────────────────────────┘
                │ HTTPS/WSS
                │ API Calls
                │ Socket.IO
                ↓
┌─────────────────────────────────────────────────┐
│            YOUR PHYSICAL SERVER                  │
│  ┌────────────────────────────────────────────┐ │
│  │   NestJS Backend (Port 4000)               │ │
│  │   - REST API (/api/v1)                     │ │
│  │   - Socket.IO (/notifications)             │ │
│  │   - File Uploads (/uploads)                │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────┴───────────────────────────────┐ │
│  │   MySQL Database                            │ │
│  │   - Employee data                           │ │
│  │   - HR records                              │ │
│  │   - Payroll data                            │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ **Vercel Account** - Sign up at https://vercel.com
2. ✅ **GitHub Repository** - HRMS code pushed to GitHub
3. ✅ **Physical Server** - Running NestJS backend on port 4000
4. ✅ **Domain or Public IP** - For backend access (domain recommended)
5. ✅ **SSL Certificate** - HTTPS for production (Let's Encrypt recommended)

---

## 🚀 Step 1: Prepare Your Physical Server Backend

### 1.1 Ensure Backend is Running

```bash
cd backend
npm install
npm run build
npm run start:prod
```

### 1.2 Configure CORS for Vercel

Update `backend/.env`:

```env
# CORS Configuration
# Add your Vercel deployment URL
CORS_ORIGIN=https://your-hrms.vercel.app,http://localhost:3000

# Or for multiple environments:
CORS_ORIGIN=https://your-hrms.vercel.app,https://your-hrms-staging.vercel.app,http://localhost:3000
```

**Important:** The backend CORS is already configured to read from `CORS_ORIGIN` environment variable. Just update your `.env` file with your Vercel URL.

### 1.3 Expose Backend to Internet

**Option A: Using a Domain (Recommended)**

1. Point your domain to your server IP (A record)
2. Set up HTTPS with Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d api.yourdomain.com
```

3. Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
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
```

**Option B: Using Public IP (Development Only)**

Open port 4000 in your firewall:

```bash
sudo ufw allow 4000/tcp
```

⚠️ **Security Warning:** Using direct IP without HTTPS is not recommended for production.

### 1.4 Test Backend Accessibility

From your local machine:

```bash
# Test API
curl https://api.yourdomain.com/api/v1/health
# or
curl http://YOUR_SERVER_IP:4000/api/v1/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your HRMS repository
4. Click **Import**

### 2.2 Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `frontend` ⚠️ **CRITICAL**

**Build Command:** `npm run build` (auto-detected)

**Output Directory:** `.next` (auto-detected)

**Install Command:** `npm install` (auto-detected)

### 2.3 Set Environment Variables

In Vercel dashboard, go to: **Settings** → **Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` | Production |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.yourdomain.com/notifications` | Production |

**Or if using IP:**

| Variable Name | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://YOUR_SERVER_IP:4000/api/v1` | Production |
| `NEXT_PUBLIC_SOCKET_URL` | `http://YOUR_SERVER_IP:4000/notifications` | Production |

**Important Notes:**
- ✅ Include `/api/v1` in the API URL
- ✅ Include `/notifications` in the Socket URL
- ✅ Use `https://` if you have SSL (recommended)
- ✅ Use `http://` only for development/testing

### 2.4 Deploy

Click **Deploy** button.

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build Next.js application
4. Deploy to CDN

Deployment URL: `https://your-project.vercel.app`

---

## ✅ Step 3: Verify Deployment

### 3.1 Check Deployment Status

Monitor the deployment logs in Vercel dashboard.

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Build completed successfully
```

### 3.2 Test Application

1. **Visit Homepage:**
   ```
   https://your-hrms.vercel.app
   ```
   Should redirect to login page

2. **Test Login:**
   - Go to `/login`
   - Use your credentials
   - Should successfully authenticate

3. **Test API Connectivity:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Login or navigate
   - Check API requests go to your backend URL

4. **Test Socket.IO:**
   - Check browser console
   - Should see: `🔌 Initializing socket connection`
   - Should see: `Socket connected successfully: <socket-id>`

### 3.3 Test CORS

If you see CORS errors:

```
Access to XMLHttpRequest at 'https://api.yourdomain.com/api/v1/...' 
from origin 'https://your-hrms.vercel.app' has been blocked by CORS policy
```

**Fix:**
1. Update backend `.env`:
   ```env
   CORS_ORIGIN=https://your-hrms.vercel.app,http://localhost:3000
   ```
2. Restart backend:
   ```bash
   npm run start:prod
   ```

---

## 🔄 Step 4: Update for Future Deployments

### 4.1 Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will:
- Detect the push
- Build and deploy automatically
- Update production URL

### 4.2 Environment Variables Updates

To update environment variables:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Edit variable
5. **Redeploy** for changes to take effect

### 4.3 Custom Domain (Optional)

To use custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain: `hrms.yourdomain.com`
3. Configure DNS as instructed by Vercel
4. Update `CORS_ORIGIN` in backend to include new domain

---

## 🐛 Troubleshooting

### Issue 1: 404 on Deployment

**Problem:** Homepage returns 404

**Solution:** Verify `Root Directory` is set to `frontend` in Vercel project settings

### Issue 2: Build Fails

**Problem:** Build fails with dependency errors

**Solution:**
```bash
# Test build locally first
cd frontend
npm install
npm run build

# Fix any errors before deploying
```

### Issue 3: API Requests Fail

**Problem:** API calls timeout or fail

**Solutions:**
1. Check `NEXT_PUBLIC_API_URL` is correct in Vercel
2. Verify backend is running: `curl https://api.yourdomain.com/api/v1/health`
3. Check backend firewall allows incoming connections
4. Verify CORS configuration includes Vercel URL

### Issue 4: Socket.IO Not Connecting

**Problem:** Real-time notifications don't work

**Solutions:**
1. Check `NEXT_PUBLIC_SOCKET_URL` in Vercel environment variables
2. Verify Socket.IO namespace is `/notifications`
3. Check backend Socket.IO CORS includes Vercel URL
4. Test Socket.IO endpoint:
   ```bash
   curl https://api.yourdomain.com/notifications
   ```

### Issue 5: Environment Variables Not Working

**Problem:** App still tries to connect to localhost

**Solutions:**
1. Verify variables start with `NEXT_PUBLIC_`
2. Redeploy after adding/updating variables
3. Check variables are set for "Production" environment
4. Clear browser cache and try again

---

## 📊 Monitoring

### Vercel Analytics

Enable analytics in Vercel dashboard for:
- Page views
- Performance metrics
- Error tracking

### Backend Logs

Monitor your backend:
```bash
# Using PM2
pm2 logs hrms-backend

# Using systemd
sudo journalctl -u hrms-backend -f

# Direct logs
tail -f backend/logs/application.log
```

### Database Monitoring

Monitor MySQL:
```bash
# Connection count
mysql -e "SHOW STATUS LIKE 'Threads_connected';"

# Slow queries
mysql -e "SHOW FULL PROCESSLIST;"
```

---

## 🔒 Security Checklist

Before going live:

- [ ] ✅ HTTPS enabled on backend (SSL certificate)
- [ ] ✅ CORS properly configured (no `origin: '*'`)
- [ ] ✅ Environment variables set in Vercel (not in code)
- [ ] ✅ `.env.local` not committed to Git
- [ ] ✅ Database has strong password
- [ ] ✅ Backend firewall configured
- [ ] ✅ JWT secret is strong and secure
- [ ] ✅ Rate limiting enabled on backend
- [ ] ✅ Helmet security headers enabled
- [ ] ✅ SQL injection protection (using Prisma ORM)

---

## 📞 Quick Reference

### Local Development URLs
```
Frontend: http://localhost:3000
Backend API: http://localhost:4000/api/v1
Socket.IO: http://localhost:4000/notifications
```

### Production URLs
```
Frontend: https://your-hrms.vercel.app
Backend API: https://api.yourdomain.com/api/v1
Socket.IO: https://api.yourdomain.com/notifications
```

### Vercel Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com/notifications
```

### Backend Environment Variables
```
CORS_ORIGIN=https://your-hrms.vercel.app,http://localhost:3000
PORT=4000
NODE_ENV=production
```

---

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ Vercel URL loads the HRMS homepage
2. ✅ Login works and redirects to dashboard
3. ✅ All API calls go to physical server
4. ✅ Socket.IO connects successfully
5. ✅ Real-time notifications work
6. ✅ No CORS errors in console
7. ✅ No localhost references in production
8. ✅ Employee/HR features work normally

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [Socket.IO CORS](https://socket.io/docs/v4/handling-cors/)
- [Let's Encrypt SSL](https://letsencrypt.org/getting-started/)

---

**Last Updated:** August 12, 2026  
**HRMS Version:** 1.0  
**Deployment Type:** Hybrid (Vercel + Physical Server)
