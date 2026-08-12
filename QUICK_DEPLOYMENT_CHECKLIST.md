# HRMS Quick Deployment Checklist

## 🚀 Ready to Deploy? Follow This Checklist

---

## ✅ Pre-Deployment (Do This First)

### 1. Update Backend CORS

Edit `backend/.env`:
```env
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app,http://localhost:3000
```

⚠️ **Replace** `your-actual-vercel-url.vercel.app` with your real URL after deployment

### 2. Ensure Backend is Accessible

**Option A: Using Domain (Recommended)**
```bash
curl https://api.yourdomain.com/api/v1/health
```

**Option B: Using IP**
```bash
curl http://YOUR_SERVER_IP:4000/api/v1/health
```

Should return: `{"status":"ok"}`

### 3. Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

---

## 🌐 Vercel Deployment

### 1. Import Project

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your HRMS repository

### 2. Configure Project

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` ⚠️ **CRITICAL** |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `npm run build` |

### 3. Add Environment Variables

Click **Environment Variables** tab:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com/notifications
```

Or if using IP:
```
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://YOUR_SERVER_IP:4000/notifications
```

### 4. Deploy

Click **Deploy** button and wait ~2-3 minutes

---

## ✅ Post-Deployment

### 1. Get Your Vercel URL

After deployment completes:
```
https://your-project-name-xyz123.vercel.app
```

### 2. Update Backend CORS (Again)

Now that you have the real URL, update `backend/.env`:
```env
CORS_ORIGIN=https://your-project-name-xyz123.vercel.app,http://localhost:3000
```

### 3. Restart Backend

```bash
cd backend
npm run start:prod
```

---

## 🧪 Test Everything

### Test 1: Homepage
```
✅ Visit: https://your-project-name-xyz123.vercel.app
✅ Should redirect to /login
```

### Test 2: Login
```
✅ Enter credentials
✅ Should successfully authenticate
✅ Should redirect to dashboard
```

### Test 3: API Calls
```
✅ Open browser DevTools (F12)
✅ Go to Network tab
✅ Check API requests go to your physical server
✅ Should see: https://api.yourdomain.com/api/v1/...
```

### Test 4: Socket.IO
```
✅ Open browser Console tab
✅ Should see: "🔌 Initializing socket connection"
✅ Should see: "Socket connected successfully"
```

### Test 5: Features
```
✅ Navigate to Employees
✅ Navigate to HR Users
✅ Navigate to Payroll
✅ Everything should work normally
```

---

## 🐛 Troubleshooting

### Problem: Homepage shows 404

**Solution:**
1. Go to Vercel Project Settings
2. Check **Root Directory** is set to `frontend`
3. Redeploy

### Problem: CORS Error

**Solution:**
1. Check backend `.env` has correct Vercel URL
2. Restart backend
3. Clear browser cache
4. Refresh page

### Problem: API calls fail

**Solution:**
1. Verify backend is running
2. Test backend: `curl https://api.yourdomain.com/api/v1/health`
3. Check firewall allows connections
4. Verify environment variables in Vercel

### Problem: Socket.IO not connecting

**Solution:**
1. Check `NEXT_PUBLIC_SOCKET_URL` in Vercel
2. Verify backend Socket.IO is running
3. Check CORS includes Vercel URL

---

## 📝 Quick Reference

### Local Development
```
Frontend:  http://localhost:3000
Backend:   http://localhost:4000/api/v1
Socket.IO: http://localhost:4000/notifications
```

### Production
```
Frontend:  https://your-project.vercel.app
Backend:   https://api.yourdomain.com/api/v1
Socket.IO: https://api.yourdomain.com/notifications
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com/notifications
```

### Backend Configuration
```env
CORS_ORIGIN=https://your-project.vercel.app,http://localhost:3000
PORT=4000
NODE_ENV=production
```

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] ✅ Vercel URL loads homepage
- [ ] ✅ Login works
- [ ] ✅ Dashboard loads
- [ ] ✅ API calls go to physical server
- [ ] ✅ Socket.IO connects
- [ ] ✅ No CORS errors
- [ ] ✅ All features work
- [ ] ✅ Local development still works

---

## 🆘 Need Help?

See detailed guides:
- **Full Guide:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Technical Details:** `DEPLOYMENT_CONFIGURATION_REPORT.md`
- **Environment Setup:** `frontend/.env.example`

---

**Deployment Time:** ~10 minutes  
**Difficulty:** Easy  
**Prerequisites:** GitHub account, Vercel account, Physical server running
