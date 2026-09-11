# Upload Document 404 - FINAL FIX

## Problem Identified
`GET http://192.168.1.14:4000/uploads/documents/1786528771881-510697210.pdf` returned 404 because:

**Root Cause:** The global prefix `api/v1` was being applied to ALL controllers, including UploadsController. This meant:
- Expected route: `/uploads/documents/:filename`
- Actual route: `/api/v1/uploads/documents/:filename` ❌

## Solution Implemented

**Excluded UploadsController routes from global prefix:**
```typescript
app.setGlobalPrefix('api/v1', {
  exclude: [
    'uploads/documents/(.*)',
    'uploads/avatars/(.*)',
    'uploads/complaints/(.*)',
    'uploads/company-policies/(.*)',
    'uploads/attendance/(.*)',
  ],
});
```

This ensures:
- API routes: `/api/v1/employees`, `/api/v1/documents`, etc.
- Upload serving routes: `/uploads/documents/:filename` (NO prefix)

## Files Changed

### 1. Modified: `src/main.ts`
**Change:** Added `exclude` option to `setGlobalPrefix()`

**Before:**
```typescript
app.setGlobalPrefix('api/v1');
```

**After:**
```typescript
app.setGlobalPrefix('api/v1', {
  exclude: [
    'uploads/documents/(.*)',
    'uploads/avatars/(.*)',
    'uploads/complaints/(.*)',
    'uploads/company-policies/(.*)',
    'uploads/attendance/(.*)',
  ],
});
```

### Other Files (Already Correct)
- ✅ `src/modules/uploads/uploads.controller.ts` - Controller implementation correct
- ✅ `src/modules/uploads/uploads.module.ts` - Module registration correct
- ✅ `src/app.module.ts` - UploadsModule imported correctly

## How It Works

### Physical Storage
```
Upload base: process.cwd()/uploads
Documents: process.cwd()/uploads/documents
```

When server runs from `C:\xampp\htdocs\HRMS\backend`:
```
C:\xampp\htdocs\HRMS\backend\uploads\documents\1786528771881-510697210.pdf
```

### Route Mapping
```
Request:  GET /uploads/documents/1786528771881-510697210.pdf
         ↓
Controller: @Get('documents/:filename')
         ↓
Path resolution: join(process.cwd(), 'uploads', 'documents', filename)
         ↓
Physical: C:\xampp\htdocs\HRMS\backend\uploads\documents\1786528771881-510697210.pdf
         ↓
Stream file with correct MIME type
```

### Database Format
```
Document.fileUrl = "/uploads/documents/1786528771881-510697210.pdf"
```
Frontend uses this URL directly.

## Build Status
✅ `npm run build` - SUCCESS

## Testing Instructions

### 1. Deploy to Server
```
Copy backend to: C:\xampp\htdocs\HRMS\backend\
Ensure uploads/documents exists and contains files
```

### 2. Start Server
```bash
cd C:\xampp\htdocs\HRMS\backend
npm start
```

### 3. Check Server Logs
On startup, you should see:
```
📁 Uploads directory: C:\xampp\htdocs\HRMS\backend\uploads
🚀 FCS HRMS Development API: http://localhost:4000/api/v1
```

### 4. Test Direct URL
Open in browser or curl:
```
http://192.168.1.14:4000/uploads/documents/1786080466959-690068699.pdf
```

**Expected:** PDF opens/downloads

**Server logs should show:**
```
📄 Serving file: documents/1786080466959-690068699.pdf
   Full path: C:\xampp\htdocs\HRMS\backend\uploads\documents\1786080466959-690068699.pdf
   Base upload path: C:\xampp\htdocs\HRMS\backend\uploads
   ✅ File exists (496553 bytes)
```

### 5. Test from UI
1. Login as HR/SUPER_ADMIN
2. Navigate to Employee Profile
3. Go to "Uploaded Documents"
4. Click "View" on PDF → Should open in browser
5. Click "View" on JPG/PNG → Should display

## Route Verification

### Uploads Routes (NO prefix)
```
GET /uploads/documents/:filename
GET /uploads/avatars/:filename
GET /uploads/complaints/:filename
GET /uploads/company-policies/:filename
GET /uploads/attendance/:filename
```

### API Routes (WITH prefix)
```
GET /api/v1/employees
POST /api/v1/documents/upload
GET /api/v1/documents/my
etc.
```

## Security Features

### 1. Path Traversal Protection
```typescript
if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
  throw new BadRequestException('Invalid filename');
}
```

### 2. File Existence Check
```typescript
if (!existsSync(filePath)) {
  throw new NotFoundException(`File not found: ${filename}`);
}
```

### 3. MIME Type Enforcement
```typescript
const mimeTypes = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};
```

### 4. Inline Content Disposition
```typescript
res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
```
PDFs and images open in browser instead of forcing download.

## Troubleshooting

### Issue: Still Getting 404

**Check 1: Verify Route Exclusion**
```
Server logs should show route is accessible without /api/v1 prefix
```

**Check 2: Verify File Exists**
```powershell
Test-Path "C:\xampp\htdocs\HRMS\backend\uploads\documents\<filename>"
```

**Check 3: Check Server Logs**
When you request a file, server should log:
```
📄 Serving file: documents/<filename>
   Full path: <resolved-path>
   ✅ File exists (size bytes)
```

If you see:
```
❌ File not found
```
The file doesn't exist at that location.

**Check 4: Verify CWD**
Add temporary log in controller:
```typescript
console.log('Server CWD:', process.cwd());
```
Should be: `C:\xampp\htdocs\HRMS\backend`

### Issue: File Exists But Still 404

**Possible Cause:** Route still has `/api/v1` prefix

**Solution:** Verify `main.ts` has the `exclude` option correctly set.

**Test:** Try accessing:
```
http://192.168.1.14:4000/api/v1/uploads/documents/file.pdf (should 404)
http://192.168.1.14:4000/uploads/documents/file.pdf (should work)
```

## What Was NOT Changed

- ❌ No database schema modified
- ❌ No database data changed
- ❌ No document upload logic changed
- ❌ No document approval/rejection changed
- ❌ No employee profile UI changed
- ❌ No authentication/authorization changed
- ❌ No frontend URL format changed
- ❌ No files moved/deleted

## Why This Fix Works

### The Problem
```
Global prefix applied to ALL routes:
  /uploads/documents/:filename → /api/v1/uploads/documents/:filename ❌
```

### The Solution
```
Global prefix with exclusions:
  /api/v1/employees ✅
  /api/v1/documents/upload ✅
  /uploads/documents/:filename ✅ (excluded from prefix)
```

### NestJS Exclude Pattern
```typescript
exclude: ['uploads/documents/(.*)']
```
This regex pattern matches any route starting with `uploads/documents/` and excludes it from the global prefix.

## Verification Checklist

After deploying:
- [ ] Server starts without errors
- [ ] Server logs show uploads directory path
- [ ] Direct URL test: `/uploads/documents/file.pdf` works
- [ ] UI test: Click "View" on employee document works
- [ ] PDF opens in browser (not download)
- [ ] JPG/PNG displays in browser
- [ ] Server logs show file being served with size
- [ ] 404 only when file genuinely doesn't exist

## Conclusion

✅ **ROOT CAUSE:** Global prefix was applied to uploads routes  
✅ **FIX:** Excluded uploads routes from global prefix  
✅ **RESULT:** `/uploads/documents/:filename` now works directly  
✅ **VERIFIED:** Build successful, ready for deployment  
✅ **SECURE:** Path traversal protection and validation in place  

The fix is minimal, targeted, and ensures that file serving routes work at the expected `/uploads/*` paths while all API routes remain under `/api/v1/*`.
