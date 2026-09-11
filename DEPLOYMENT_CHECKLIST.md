# Upload Route Fix - Deployment Checklist

## ✅ Pre-Deployment Verification (Development Machine)

- [x] TypeScript compilation passes
- [x] NestJS build succeeds
- [x] Route registration confirmed in logs
- [x] UploadsModule imported in AppModule
- [x] UploadsController registered in UploadsModule
- [x] Route exclusion configured in main.ts
- [x] Localhost testing passes
- [x] Debug logging added to controller
- [x] Documentation created

## 📋 Deployment Steps (Production Server: 192.168.1.14)

### Step 1: Commit Changes (Development Machine)
- [ ] Review all modified files
- [ ] Commit changes to git
- [ ] Push to repository

```bash
cd C:\Users\ADITYA\OneDrive\Desktop\HRMS\backend
git status
git add src/modules/uploads/uploads.controller.ts
git commit -m "fix: Add comprehensive logging and fix upload document route serving"
git push origin main
```

### Step 2: Deploy to Server
- [ ] SSH into production server
- [ ] Pull latest changes
- [ ] Install dependencies (if needed)
- [ ] Build application
- [ ] Restart server

```bash
ssh user@192.168.1.14
cd /path/to/backend
git pull origin main
npm ci --production  # Only if package.json changed
npm run build
pm2 restart hrms-backend  # Or your restart command
```

### Step 3: Verify Deployment
- [ ] Check build completed without errors
- [ ] Check server started successfully
- [ ] Verify route registration in logs

Expected in server console:
```
[RouterExplorer]: Mapped {/uploads/documents/:filename, GET} route
[RouterExplorer]: Mapped {/uploads/avatars/:filename, GET} route
[RouterExplorer]: Mapped {/uploads/complaints/:filename, GET} route
[RouterExplorer]: Mapped {/uploads/company-policies/:filename, GET} route
[RouterExplorer]: Mapped {/uploads/attendance/:filename, GET} route
```

### Step 4: Test Upload Route
- [ ] Test with curl from command line
- [ ] Test from browser
- [ ] Test from frontend application
- [ ] Check server console for debug logs

```bash
# From any machine
curl -I http://192.168.1.14:4000/uploads/documents/EXISTING_FILE.pdf
```

Expected Response:
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: XXXXX
Content-Disposition: inline; filename="EXISTING_FILE.pdf"
```

### Step 5: Monitor Server Logs
- [ ] Check PM2 logs
- [ ] Look for "UPLOAD DOCUMENT ROUTE HIT" message
- [ ] Verify file path resolution is correct
- [ ] Confirm file exists message appears

```bash
# Monitor logs in real-time
pm2 logs hrms-backend --lines 100

# Or check log file directly
tail -f /path/to/logs/hrms-backend.log
```

Expected Log Output:
```
UPLOAD DOCUMENT ROUTE HIT: FILENAME.pdf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Serving file: documents/FILENAME.pdf
   UPLOAD_DIR: ./uploads
   Base upload path: /full/path/to/uploads
   Full path: /full/path/to/uploads/documents/FILENAME.pdf
   File exists: true
   ✅ File exists (SIZE bytes)
   Content-Type: application/pdf
   Streaming file...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🧪 Testing Checklist

### Basic Tests
- [ ] Health endpoint works: GET /api/v1/health
- [ ] Document route works: GET /uploads/documents/:filename
- [ ] Avatar route works: GET /uploads/avatars/:filename
- [ ] Complaint route works: GET /uploads/complaints/:filename
- [ ] Company policy route works: GET /uploads/company-policies/:filename
- [ ] Attendance route works: GET /uploads/attendance/:filename

### Error Handling Tests
- [ ] Non-existent file returns 404
- [ ] Invalid filename (with ../) returns 400
- [ ] Server logs show appropriate error messages

### Integration Tests
- [ ] Frontend can load documents
- [ ] HR can view employee documents
- [ ] Super Admin can view company policies
- [ ] Employees can view their own documents

### Performance Tests
- [ ] File streaming works for large files (>10MB)
- [ ] Multiple simultaneous downloads work
- [ ] No memory leaks during file serving

## 🐛 Troubleshooting Guide

### If Route Returns 404

#### Check 1: Module Registration
```bash
# In app.module.ts, verify:
imports: [
  ...
  UploadsModule,  // ✅ Must be present
]
```

#### Check 2: Route Exclusion
```bash
# In main.ts, verify:
app.setGlobalPrefix('api/v1', {
  exclude: [
    'uploads/documents/(.*)',  // ✅ Must be present
    'uploads/avatars/(.*)',
    ...
  ],
});
```

#### Check 3: Build Artifacts
```bash
# Verify dist folder has latest changes
ls -la dist/src/modules/uploads/
cat dist/src/modules/uploads/uploads.controller.js | grep "UPLOAD DOCUMENT ROUTE HIT"
```

#### Check 4: Server Restart
```bash
# Ensure server actually restarted with new code
pm2 restart hrms-backend
pm2 logs hrms-backend --lines 50  # Check startup logs
```

### If File Not Found (but route works)

#### Check 1: File Location
```bash
# Verify file exists
ls -la /path/to/backend/uploads/documents/
```

#### Check 2: File Permissions
```bash
# Verify Node.js can read files
chmod 644 /path/to/backend/uploads/documents/*
chmod 755 /path/to/backend/uploads/documents/
```

#### Check 3: Upload Directory Path
```bash
# Check .env file
cat .env | grep UPLOAD_DIR
# Should be: UPLOAD_DIR=./uploads
```

#### Check 4: Console Logs
```bash
# Check resolved file path in logs
pm2 logs hrms-backend | grep "Full path:"
# Verify path matches actual file location
```

### If Route Works but File Won't Stream

#### Check 1: File Corruption
```bash
# Verify file is valid
file /path/to/backend/uploads/documents/FILENAME.pdf
# Should show: PDF document
```

#### Check 2: MIME Type
```bash
# Check Content-Type in response
curl -I http://192.168.1.14:4000/uploads/documents/FILENAME.pdf | grep Content-Type
# Should be: Content-Type: application/pdf
```

#### Check 3: Stream Errors
```bash
# Check for stream errors in logs
pm2 logs hrms-backend | grep "Error streaming"
```

## 📞 Support Contacts

### If All Else Fails

1. **Check Documentation**
   - Read: `backend/UPLOAD_ROUTE_FIX_README.md`
   - Read: `UPLOAD_FIX_SUMMARY.txt`

2. **Review Logs**
   - Server console logs
   - PM2 logs: `pm2 logs hrms-backend`
   - Application logs in `logs/` directory

3. **Verify Network**
   - Test from server itself: `curl -I http://localhost:4000/uploads/documents/FILE.pdf`
   - Test from LAN: `curl -I http://192.168.1.14:4000/uploads/documents/FILE.pdf`
   - Check firewall rules

4. **Rollback Option**
   ```bash
   git log  # Find previous commit
   git checkout PREVIOUS_COMMIT_HASH
   npm run build
   pm2 restart hrms-backend
   ```

## ✅ Sign-Off Checklist

### Development
- [x] Code changes completed
- [x] TypeScript compilation passes
- [x] Build succeeds
- [x] Local testing passes
- [x] Documentation created
- [x] Test scripts created

### Deployment
- [ ] Changes committed to git
- [ ] Code pushed to repository
- [ ] Deployed to production server
- [ ] Build completed on server
- [ ] Server restarted
- [ ] Routes registered (verified in logs)

### Testing
- [ ] Upload route returns 200 OK
- [ ] Files stream correctly
- [ ] Debug logs appear in console
- [ ] Error handling works (404 for missing files)
- [ ] Frontend integration works

### Documentation
- [x] README created
- [x] Summary document created
- [x] Deployment checklist created
- [x] Test scripts created
- [ ] Team notified of changes

## 📅 Deployment Log

| Date | Time | Action | Status | Notes |
|------|------|--------|--------|-------|
| 2026-09-11 | 10:35 | Fix completed on dev machine | ✅ Complete | Added comprehensive logging |
| | | Deployed to 192.168.1.14 | ⏳ Pending | Awaiting deployment |
| | | Testing completed | ⏳ Pending | After deployment |
| | | Production verification | ⏳ Pending | After testing |

---

**Note**: Update this checklist as you progress through deployment steps.
Mark items with [x] as they are completed.

**Created**: 2026-09-11 10:35 AM  
**Last Updated**: 2026-09-11 10:35 AM  
**Status**: Ready for Deployment
