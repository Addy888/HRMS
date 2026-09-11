# Document Upload Path Fix - Deployment Instructions

## Problem Summary
The document serving route returns 404 because the file path resolution was hard-coded and not properly using the `UPLOAD_DIR` environment variable.

## Changes Made

### 1. UploadsController (`src/modules/uploads/uploads.controller.ts`)
- **Before**: Hard-coded `join(process.cwd(), 'uploads')`
- **After**: Properly resolves path from `UPLOAD_DIR` environment variable
- Added comprehensive logging to debug path resolution issues
- Added debug endpoint: `GET /uploads/_debug/info` to inspect configuration
- Lists actual files in folder when a file is not found

### 2. LocalStorageService (`src/modules/documents/storage/local-storage.service.ts`)
- **Before**: Hard-coded `join(process.cwd(), 'uploads')`
- **After**: Properly resolves path from `UPLOAD_DIR` environment variable
- Consistent path resolution with UploadsController
- Added initialization logging

## Deployment Steps

### On Development Machine:
1. ✅ Already done - Code has been built
2. Copy the `dist` folder to production server

### On Production Server (192.168.1.14):

#### Step 1: Backup Current Code (Optional but Recommended)
```bash
cd C:\xampp\htdocs\HRMS\backend
mkdir backup_before_upload_fix
xcopy /E /I dist backup_before_upload_fix\dist
```

#### Step 2: Copy New Build
Copy the entire `dist` folder from development to production:
- **From**: `C:\Users\ADITYA\OneDrive\Desktop\HRMS\backend\dist`
- **To**: `C:\xampp\htdocs\HRMS\backend\dist`

#### Step 3: Verify .env Configuration
Check that `C:\xampp\htdocs\HRMS\backend\.env` contains:
```
UPLOAD_DIR=./uploads
```

If `UPLOAD_DIR` is not set or set incorrectly, update it to `./uploads`

#### Step 4: Verify Upload Directories Exist
Ensure these directories exist:
```
C:\xampp\htdocs\HRMS\backend\uploads\documents
C:\xampp\htdocs\HRMS\backend\uploads\avatars
C:\xampp\htdocs\HRMS\backend\uploads\complaints
C:\xampp\htdocs\HRMS\backend\uploads\company-policies
C:\xampp\htdocs\HRMS\backend\uploads\attendance
```

If missing, create them:
```bash
cd C:\xampp\htdocs\HRMS\backend
mkdir uploads\documents
mkdir uploads\avatars
mkdir uploads\complaints
mkdir uploads\company-policies
mkdir uploads\attendance
```

#### Step 5: Restart the Application

**If using PM2:**
```bash
pm2 restart hrms-backend
pm2 logs hrms-backend --lines 50
```

**If running directly:**
1. Stop the current process (Ctrl+C or Task Manager)
2. Start again:
```bash
cd C:\xampp\htdocs\HRMS\backend
node dist/src/main.js
```

#### Step 6: Verify the Fix

##### A. Check Server Logs
Look for these initialization messages in the console:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LocalStorageService Initialized
  UPLOAD_DIR env: ./uploads
  process.cwd(): C:\xampp\htdocs\HRMS\backend
  Base upload path: C:\xampp\htdocs\HRMS\backend\uploads
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

And:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UploadsController Initialized
  UPLOAD_DIR env: ./uploads
  process.cwd(): C:\xampp\htdocs\HRMS\backend
  Base upload path: C:\xampp\htdocs\HRMS\backend\uploads
  Path exists: true
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

##### B. Check Debug Endpoint
Visit: `http://192.168.1.14:4000/uploads/_debug/info`

Expected response:
```json
{
  "uploadDir": "./uploads",
  "cwd": "C:\\xampp\\htdocs\\HRMS\\backend",
  "baseUploadPath": "C:\\xampp\\htdocs\\HRMS\\backend\\uploads",
  "pathExists": true,
  "folders": {
    "documents": {
      "path": "C:\\xampp\\htdocs\\HRMS\\backend\\uploads\\documents",
      "exists": true,
      "fileCount": 15,
      "sampleFiles": [
        "1786528771881-510697210.pdf",
        "..."
      ]
    },
    ...
  }
}
```

##### C. Test Document Access
Try accessing a document:
```
http://192.168.1.14:4000/uploads/documents/1786528771881-510697210.pdf
```

##### D. Check Detailed Request Logs
When you access a document, the server will log:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 DOCUMENT REQUEST: 1786528771881-510697210.pdf
   Folder: documents
   UPLOAD_DIR env: ./uploads
   process.cwd(): C:\xampp\htdocs\HRMS\backend
   Base upload path: C:\xampp\htdocs\HRMS\backend\uploads
   Folder path: C:\xampp\htdocs\HRMS\backend\uploads\documents
   Full file path: C:\xampp\htdocs\HRMS\backend\uploads\documents\1786528771881-510697210.pdf
   Folder exists: true
   File exists: true
   ✅ File found (145234 bytes)
   Last modified: 2025-02-08T10:30:00.000Z
   Content-Type: application/pdf
   Streaming file...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### If File Still Not Found:

1. **Check the debug endpoint first** - it will tell you exactly where the server is looking for files

2. **Look at the server logs** - they now show:
   - The exact file path being checked
   - Whether the folder exists
   - List of files actually in the folder

3. **Common Issues:**
   - **UPLOAD_DIR not set**: Set `UPLOAD_DIR=./uploads` in `.env`
   - **Wrong working directory**: Server might be running from different directory
   - **Files in wrong location**: Files might be in Desktop workspace instead of production
   - **Database mismatch**: Database might have different file records than filesystem

4. **Find the actual file location:**
   ```bash
   cd C:\xampp\htdocs\HRMS
   dir /s /b *1786528771881-510697210*
   ```

5. **Check database record:**
   Query the document table to see what `fileUrl` is stored

## File Copying (If Needed)

If the files are in the Desktop workspace but need to be in production:

```bash
xcopy /E /I /Y "C:\Users\ADITYA\OneDrive\Desktop\HRMS\backend\uploads" "C:\xampp\htdocs\HRMS\backend\uploads"
```

## Expected Behavior After Fix

✅ Document URLs work: `http://192.168.1.14:4000/uploads/documents/{filename}`
✅ Avatar URLs work: `http://192.168.1.14:4000/uploads/avatars/{filename}`
✅ Complaint attachments work: `http://192.168.1.14:4000/uploads/complaints/{filename}`
✅ Server logs show exact paths for debugging
✅ Debug endpoint shows configuration and file listings
✅ File not found errors show what files ARE available

## Testing Checklist

- [ ] Server restarts without errors
- [ ] Server logs show correct initialization paths
- [ ] Debug endpoint returns configuration
- [ ] Documents can be accessed via URL
- [ ] HR can view employee documents
- [ ] Avatars display correctly
- [ ] No 404 errors in browser console

## Rollback Plan (If Needed)

If something goes wrong:
```bash
cd C:\xampp\htdocs\HRMS\backend
rmdir /s /q dist
xcopy /E /I backup_before_upload_fix\dist dist
# Restart server
```

## Notes

- The fix maintains backward compatibility - existing file URLs continue to work
- No database changes required
- No frontend changes required
- Path resolution is now consistent between upload and serve operations
- Comprehensive logging helps diagnose any future issues
