# PDF Loading Pipeline Fix - Debugging Guide

## Problem
The Secure Policy Viewer loads forever. The viewer renders but the PDF document never appears.

## Root Cause Analysis

The issue is in the **file path pipeline** from upload → database → serving. Here's what was fixed:

### 1. ✅ Database Schema (Already Correct)
```prisma
model CompanyPolicy {
  fileUrl String  // Stores the file path
}
```

### 2. ✅ Upload Configuration (Already Correct)
**File:** `backend/src/common/config/multer.config.ts`
- Destination: `./uploads/company-policies`
- Filename: `policy-{timestamp}-{random}.pdf`
- Multer stores path in `file.path`

### 3. ❌ Path Normalization (FIXED)
**Issue:** Windows uses backslashes, path might have `./` prefix
**Fix:** Normalize path before serving

### 4. ✅ Error Handling (ADDED)
- Added detailed logging throughout the pipeline
- Added file existence checks
- Added meaningful error messages

## Files Modified

### 1. Backend Controller
**File:** `backend/src/modules/policies/company-policies.controller.ts`

**Changes:**
- Added path normalization (remove `./` prefix, convert backslashes)
- Added file existence check with `fs.existsSync()`
- Added detailed console logging for debugging
- Added alternate path checking
- Added stream error handling
- Added proper HTTP headers

**Key Code:**
```typescript
// Normalize the file path - remove leading ./ or .\ and ensure forward slashes
let normalizedPath = policy.fileUrl.replace(/^\.[\\/]/, '').replace(/\\/g, '/');

// Construct the file path
const filePath = join(process.cwd(), normalizedPath);

// Check if file exists
const fs = await import('fs');
if (!fs.existsSync(filePath)) {
  console.error('❌ File not found at path:', filePath);
  // Try alternate paths...
  throw new NotFoundException(`Policy file not found...`);
}
```

### 2. Backend Service
**File:** `backend/src/modules/policies/company-policies.service.ts`

**Changes:**
- Added detailed logging during upload
- Log file details (originalname, filename, path, size)
- Log policy creation in database

**Key Code:**
```typescript
console.log('=== Uploading Company Policy ===');
console.log('File details:', {
  originalname: file.originalname,
  filename: file.filename,
  path: file.path,
  size: file.size,
});
console.log('Created policy in DB:', {
  id: newPolicy.id,
  fileUrl: newPolicy.fileUrl,
});
```

### 3. Frontend View Page
**File:** `frontend/src/app/company-policies/[id]/view/page.tsx`

**Changes:**
- Added detailed console logging for PDF fetch
- Added response status and size logging
- Added specific error messages based on HTTP status
- Improved error handling with detailed error info

**Key Code:**
```typescript
console.log('Fetching PDF for policy:', resolvedParams.id);
console.log('PDF Response:', {
  status: pdfResponse.status,
  contentType: pdfResponse.headers['content-type'],
  size: pdfResponse.data.size,
});

if (err.response?.status === 404) {
  setError('Policy document file not found on server');
} else if (err.response?.status === 500) {
  setError('Server error loading policy document');
}
```

### 4. Frontend PDF Viewer
**File:** `frontend/src/components/PolicyPdfViewer.tsx`

**Changes:**
- Added logging when component mounts
- Added null check for pdfData
- Display error if no PDF data provided

**Key Code:**
```typescript
useEffect(() => {
  setMounted(true);
  console.log('PolicyPdfViewer mounted with pdfData:', pdfData);
}, [pdfData]);

if (!pdfData) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-red-400">No PDF data provided</p>
    </div>
  );
}
```

## Debugging Steps

### Step 1: Upload a PDF (HR Role)
1. Login as HR user
2. Navigate to Company Policies
3. Upload a PDF file
4. Check backend console logs:

```
=== Uploading Company Policy ===
File details: {
  originalname: 'policy.pdf',
  filename: 'policy-1234567890-123456789.pdf',
  path: 'uploads\\company-policies\\policy-1234567890-123456789.pdf',
  size: 1234567,
  mimetype: 'application/pdf'
}
Created policy in DB: {
  id: 'uuid-here',
  fileUrl: 'uploads\\company-policies\\policy-1234567890-123456789.pdf'
}
```

**✅ Verify:**
- File is physically present at: `backend/uploads/company-policies/policy-*.pdf`
- Database has correct `fileUrl` value

### Step 2: Open Policy Viewer (Employee Role)
1. Login as Employee user
2. Navigate to Policies → View Policy
3. Check backend console logs:

```
=== PDF View Request ===
Policy ID: uuid-here
Policy fileUrl from DB: uploads\company-policies\policy-*.pdf
Normalized path: uploads/company-policies/policy-*.pdf
Full file path: C:\path\to\HRMS\backend\uploads\company-policies\policy-*.pdf
Process cwd: C:\path\to\HRMS\backend
✅ File found, creating stream...
✅ Streaming PDF to client
```

4. Check frontend console logs:

```
Fetching PDF for policy: uuid-here
Policy data: { id: '...', policyName: '...', ... }
PDF Response: {
  status: 200,
  contentType: 'application/pdf',
  size: 1234567
}
Created blob URL: blob:http://localhost:3000/...
PolicyPdfViewer mounted with pdfData: blob:http://localhost:3000/...
```

### Step 3: Check Browser Network Tab
1. Open Developer Tools → Network tab
2. Look for request to `/api/v1/company-policies/{id}/view`
3. Check:
   - ✅ Status: `200 OK`
   - ✅ Content-Type: `application/pdf`
   - ✅ Size: Should match uploaded file size
   - ❌ Status: `404` → File not found on server
   - ❌ Status: `500` → Server error

## Common Issues and Solutions

### Issue 1: 404 Not Found
**Symptom:** Backend logs show "File not found at path"

**Solutions:**
1. Check if file exists:
   ```bash
   dir backend\uploads\company-policies
   ```
2. Check database `fileUrl` value:
   ```sql
   SELECT id, policyName, fileUrl FROM CompanyPolicy;
   ```
3. Verify path matches exactly

### Issue 2: Empty Blob (size: 0)
**Symptom:** Frontend logs show `size: 0`

**Solutions:**
1. Check if `StreamableFile` is returning data
2. Verify file is not corrupted
3. Check file permissions

### Issue 3: Infinite Loading
**Symptom:** Viewer shows but PDF never appears

**Solutions:**
1. Check for JavaScript errors in browser console
2. Verify blob URL is created
3. Check if `PolicyPdfViewer` receives `pdfData`
4. Verify PDF.js worker is loading

### Issue 4: CORS Error
**Symptom:** Browser shows CORS error

**Solutions:**
1. Backend and frontend must be on same origin OR
2. Backend must have CORS enabled for blob responses

## Testing Checklist

- [ ] Upload a PDF as HR
- [ ] Check backend console for upload logs
- [ ] Verify file exists in `backend/uploads/company-policies/`
- [ ] Check database for correct `fileUrl` value
- [ ] Login as Employee
- [ ] Navigate to Policy Viewer
- [ ] Check backend console for view logs
- [ ] Check frontend console for fetch logs
- [ ] Check browser Network tab for 200 OK response
- [ ] Verify PDF appears in viewer
- [ ] Verify all pages load correctly
- [ ] Test with different PDF files
- [ ] Test with large PDF files (>10MB)

## Expected Console Output (Success)

### Backend Upload:
```
=== Uploading Company Policy ===
File details: { ... }
Created policy in DB: { ... }
```

### Backend View:
```
=== PDF View Request ===
Policy ID: ...
Policy fileUrl from DB: ...
Normalized path: ...
Full file path: ...
✅ File found, creating stream...
✅ Streaming PDF to client
```

### Frontend:
```
Fetching PDF for policy: ...
PDF Response: { status: 200, contentType: 'application/pdf', size: ... }
Created blob URL: blob:...
PolicyPdfViewer mounted with pdfData: blob:...
```

## Path Examples

### Windows:
- Multer stores: `uploads\company-policies\policy-*.pdf`
- Normalized: `uploads/company-policies/policy-*.pdf`
- Full path: `C:\Users\...\HRMS\backend\uploads\company-policies\policy-*.pdf`

### Linux/Mac:
- Multer stores: `uploads/company-policies/policy-*.pdf`
- Normalized: `uploads/company-policies/policy-*.pdf`
- Full path: `/home/.../HRMS/backend/uploads/company-policies/policy-*.pdf`

## Summary

**Fixed:**
- ✅ Path normalization (Windows/Linux compatibility)
- ✅ File existence checking
- ✅ Detailed error logging
- ✅ Frontend error handling
- ✅ Meaningful error messages

**Pipeline Flow:**
1. HR uploads PDF → Multer saves to `uploads/company-policies/`
2. Backend stores path in database (`fileUrl`)
3. Employee requests view → Backend normalizes path
4. Backend checks file exists → Streams file
5. Frontend receives blob → Creates blob URL
6. PDF.js renders blob URL → PDF displays

**Next Steps:**
1. Restart backend server
2. Test upload flow
3. Test view flow
4. Check all console logs
5. Verify PDF displays correctly
