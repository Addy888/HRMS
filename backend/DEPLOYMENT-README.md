# Document Upload Fix - Deployment Package

## Quick Start

### If you have network access to production server:
```bash
.\deploy-to-network.bat
```

### If deploying manually:
See `DOCUMENT-UPLOAD-FIX-INSTRUCTIONS.md`

### If troubleshooting after deployment:
Run on production server:
```bash
node diagnose-production.js 1786528771881-510697210.pdf
```

## Files in This Package

### Documentation
- **UPLOAD-FIX-SUMMARY.md** - Complete overview of the fix
- **DOCUMENT-UPLOAD-FIX-INSTRUCTIONS.md** - Step-by-step deployment guide
- **DEPLOYMENT-README.md** - This file

### Deployment Scripts
- **deploy-to-network.bat** - Automated network deployment (if server is accessible)
- **deploy-to-production.bat** - Local deployment (if running on same machine)
- **deploy-upload-fix.bat** - Original build-only script

### Diagnostic Tools
- **diagnose-production.js** - Production server diagnostic tool
- **find-document-file.js** - File location finder

### Source Code Changes
Built and ready in the `dist` folder:
- `dist/src/modules/uploads/uploads.controller.js`
- `dist/src/modules/documents/storage/local-storage.service.js`

## What Was Fixed

### Problem
Document URLs returned 404 because file paths were hard-coded and didn't respect the `UPLOAD_DIR` environment variable.

### Solution
1. **Dynamic path resolution** - Now properly uses `UPLOAD_DIR` from `.env`
2. **Comprehensive logging** - Shows exact paths being used
3. **Debug endpoint** - `GET /uploads/_debug/info` for configuration inspection
4. **Better error messages** - Lists available files when requested file not found

### No Changes Required For
- Database
- Frontend
- Document upload logic
- Authentication
- Existing file URLs

## Deployment Process

### 1. Build (Already Done)
✅ Code has been compiled and built
✅ TypeScript compilation passed
✅ Ready in `dist` folder

### 2. Deploy to Production Server
Choose your method:

#### Option A: Network Deployment
```bash
.\deploy-to-network.bat
```
Automatically copies files via network share and creates backup.

#### Option B: Manual Copy
1. Copy `dist` folder to production:
   ```
   From: C:\Users\ADITYA\OneDrive\Desktop\HRMS\backend\dist
   To: C:\xampp\htdocs\HRMS\backend\dist
   ```

2. Verify `.env` has:
   ```
   UPLOAD_DIR=./uploads
   ```

3. Restart server:
   ```bash
   pm2 restart hrms-backend
   ```

#### Option C: Remote Desktop
1. RDP to 192.168.1.14
2. Follow instructions in `DOCUMENT-UPLOAD-FIX-INSTRUCTIONS.md`

### 3. Verify Deployment
After deployment, check:

1. **Debug endpoint**: http://192.168.1.14:4000/uploads/_debug/info
   - Should show correct paths and file listings

2. **Server logs**: Should show initialization messages with correct paths

3. **Test document access**: Try opening a document URL

4. **Application test**: Login and view employee documents

## If Something Goes Wrong

### 1. Run Diagnostic Script
On production server:
```bash
cd C:\xampp\htdocs\HRMS\backend
node diagnose-production.js 1786528771881-510697210.pdf
```

This will show:
- Environment configuration
- Resolved paths
- Available files
- Database records
- Where the file actually exists (if anywhere)

### 2. Check Debug Endpoint
```
http://192.168.1.14:4000/uploads/_debug/info
```

### 3. Check Server Logs
Look for detailed request logs showing exactly what paths are being checked

### 4. Common Issues

**Issue**: File still not found
- **Check**: Debug endpoint shows correct paths?
- **Check**: File actually exists in that location?
- **Check**: Database record has correct fileUrl?
- **Fix**: Copy files to correct location or update path configuration

**Issue**: Wrong upload directory
- **Check**: `.env` file has `UPLOAD_DIR=./uploads`
- **Check**: Server was restarted after .env change
- **Fix**: Update .env and restart

**Issue**: Permission denied
- **Check**: Upload folders have correct permissions
- **Fix**: `icacls "uploads" /grant Users:(OI)(CI)F /T`

### 5. Rollback
If needed:
```bash
cd C:\xampp\htdocs\HRMS\backend
rmdir /s /q dist
move dist_backup dist
# Restart server
```

## Success Criteria

After successful deployment:
- ✅ Debug endpoint returns configuration
- ✅ Server logs show correct initialization
- ✅ Documents accessible via URL
- ✅ No 404 errors for existing files
- ✅ HR can view employee documents
- ✅ New uploads work correctly

## Support Checklist

If issues persist:
- [ ] Run `diagnose-production.js` on server
- [ ] Check debug endpoint response
- [ ] Verify .env configuration
- [ ] Check server initialization logs
- [ ] Review per-request logs
- [ ] Verify filesystem structure
- [ ] Check database records
- [ ] Ensure server was restarted

## Quick Reference

### Production Server Details
- IP: 192.168.1.14
- Port: 4000
- Path: C:\xampp\htdocs\HRMS\backend
- Upload Dir: C:\xampp\htdocs\HRMS\backend\uploads

### Key URLs
- Debug endpoint: http://192.168.1.14:4000/uploads/_debug/info
- Document URL format: http://192.168.1.14:4000/uploads/documents/{filename}
- API docs: http://192.168.1.14:4000/api

### Key Commands
```bash
# Restart server (PM2)
pm2 restart hrms-backend
pm2 logs hrms-backend

# Restart server (direct)
node dist/src/main.js

# Diagnose issues
node diagnose-production.js [filename]

# Check files
dir uploads\documents

# Test connectivity
ping 192.168.1.14
```

## Next Steps

1. **Deploy the fix** - Use one of the deployment methods above
2. **Verify it works** - Check debug endpoint and test document access
3. **Monitor logs** - Watch for any issues in server logs
4. **Test thoroughly** - Verify all document types work
5. **Clean up** - Remove backup folders after confirming success

---

**Questions or Issues?**
Refer to the detailed documentation in `DOCUMENT-UPLOAD-FIX-INSTRUCTIONS.md`
