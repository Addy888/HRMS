# HR Document View Fix - Implementation Complete

## Problem Identified
Employee documents were uploading correctly to backend at:
```
backend/uploads/documents/1786083586672-332033572.pdf
```

But clicking "View" in HR interface was opening:
```
http://localhost:3000/uploads/documents/1786083586672-332033572.pdf
```

This was requesting from Next.js frontend (port 3000) which returned 404, because documents are served by NestJS backend (port 4000).

---

## Root Cause
The `handleView()` function was using:
```typescript
window.open(doc.fileUrl, '_blank');
```

Where `doc.fileUrl` was a relative path like `/uploads/documents/file.pdf`, causing the browser to open it relative to the current origin (frontend).

---

## Solution Implemented

### Frontend Fix (`frontend/src/app/hr/employees/[id]/page.tsx`)

Updated `handleView()` function in `DocumentCard` component:

```typescript
const handleView = () => {
  // Build complete backend URL
  const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1')
    .replace('/api/v1', '');
  
  let documentUrl = '';
  
  if (doc.fileUrl) {
    // Check if fileUrl is already a complete URL
    if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
      documentUrl = doc.fileUrl;
    } else {
      // Relative path - prepend backend URL
      const filePath = doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`;
      documentUrl = `${BACKEND_URL}${filePath}`;
    }
  } else if (doc.fileName) {
    // Fallback: construct path from fileName
    documentUrl = `${BACKEND_URL}/uploads/documents/${doc.fileName}`;
  } else {
    alert('Document file not found.');
    return;
  }

  console.log('Opening document:', documentUrl);
  window.open(documentUrl, '_blank');
};
```

### How It Works:

1. **Extract Backend URL:**
   ```typescript
   const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '');
   // Result: http://localhost:4000
   ```

2. **Check if fileUrl is absolute:**
   - If starts with `http://` or `https://` → Use as-is
   - If relative → Prepend backend URL

3. **Construct Full URL:**
   ```typescript
   // Input: doc.fileUrl = "/uploads/documents/1786083586672-332033572.pdf"
   // Output: "http://localhost:4000/uploads/documents/1786083586672-332033572.pdf"
   ```

4. **Fallback for missing fileUrl:**
   - If `fileUrl` is null but `fileName` exists
   - Construct: `http://localhost:4000/uploads/documents/${fileName}`

5. **Error Handling:**
   - If both `fileUrl` and `fileName` are missing
   - Show alert: "Document file not found."

---

## Backend Verification

### Static File Serving (`backend/src/main.ts`)

Already configured correctly:
```typescript
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
```

This serves files from `backend/uploads/` at the `/uploads` path.

### Directory Structure Verified

```
backend/
└── uploads/
    ├── avatars/
    ├── company-policies/
    ├── complaints/
    └── documents/
        ├── 1786080466959-690068699.pdf ✅
        ├── 1786083555776-336911021.png ✅
        ├── 1786083561319-365357846.jpeg ✅
        ├── 1786083566179-416767523.jpeg ✅
        ├── 1786083574729-40190248.pdf ✅
        ├── 1786083578804-149332556.pdf ✅
        └── 1786083586672-332033572.pdf ✅
```

All uploaded documents are present in the correct location.

---

## URL Transformation Examples

### Example 1: Relative Path
```
Input:
  doc.fileUrl = "/uploads/documents/1786083586672-332033572.pdf"
  NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1"

Process:
  BACKEND_URL = "http://localhost:4000"
  documentUrl = "http://localhost:4000" + "/uploads/documents/1786083586672-332033572.pdf"

Output:
  "http://localhost:4000/uploads/documents/1786083586672-332033572.pdf" ✅
```

### Example 2: Absolute URL (Production)
```
Input:
  doc.fileUrl = "https://cdn.example.com/documents/file.pdf"

Process:
  Starts with "https://" → Use as-is

Output:
  "https://cdn.example.com/documents/file.pdf" ✅
```

### Example 3: Missing fileUrl, has fileName
```
Input:
  doc.fileUrl = null
  doc.fileName = "resume.pdf"
  BACKEND_URL = "http://localhost:4000"

Process:
  Fallback to: BACKEND_URL + "/uploads/documents/" + fileName

Output:
  "http://localhost:4000/uploads/documents/resume.pdf" ✅
```

### Example 4: Missing both
```
Input:
  doc.fileUrl = null
  doc.fileName = null

Process:
  Show alert and return early

Output:
  Alert: "Document file not found." ⚠️
```

---

## Other Pages Already Fixed

### HR Documents Page (`frontend/src/app/hr/documents/page.tsx`)
Already using correct approach:
```typescript
href={`${api.defaults.baseURL?.replace('/api/v1', '')}${selectedDoc.fileUrl}`}
```

### Employee Documents Page (`frontend/src/app/employee/documents/page.tsx`)
Already using correct approach:
```typescript
href={`${api.defaults.baseURL?.replace('/api/v1', '')}${doc.fileUrl}`}
```

---

## Testing Instructions

### Test Case 1: View Document from HR Employee Details
1. Login as HR
2. Navigate to `/hr/employees/{employee-id}`
3. Scroll to Documents section
4. Click **View** button on any document
5. **Expected:** Document opens in new tab from `http://localhost:4000/uploads/documents/...`
6. **Expected:** Document displays correctly (PDF/Image)

### Test Case 2: Console Log Verification
1. Open Browser DevTools → Console
2. Click **View** on a document
3. **Expected:** See log: `Opening document: http://localhost:4000/uploads/documents/...`

### Test Case 3: Missing File Handling
1. Manually edit a document in database to have null `fileUrl` and `fileName`
2. Try to view that document
3. **Expected:** Alert: "Document file not found."

### Test Case 4: Absolute URL (for future CDN support)
1. Edit a document in database to have `fileUrl = "https://cdn.example.com/file.pdf"`
2. Click **View**
3. **Expected:** Opens `https://cdn.example.com/file.pdf` (not prepended with backend URL)

---

## Environment Variables

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Backend URL extracted: `http://localhost:4000`

### Production Example
```env
NEXT_PUBLIC_API_URL=https://api.hrms.company.com/api/v1
```

Backend URL extracted: `https://api.hrms.company.com`

---

## Files Changed

1. ✅ `frontend/src/app/hr/employees/[id]/page.tsx`
   - Updated `handleView()` in `DocumentCard` component
   - Added backend URL construction logic
   - Added fallback for missing fileUrl
   - Added error handling

---

## What Was NOT Changed

❌ **Upload Logic** - No changes to document upload
❌ **Database Schema** - No changes to Document table
❌ **Backend API** - No changes to documents service/controller
❌ **Storage Logic** - No changes to local-storage.service.ts
❌ **Other Pages** - HR Documents and Employee Documents already working

---

## Verification Checklist

- [x] Backend serves files at `/uploads` endpoint
- [x] `backend/uploads/documents/` directory exists
- [x] Uploaded document files are present
- [x] Frontend extracts backend URL from env var
- [x] Relative paths are converted to absolute URLs
- [x] Absolute URLs are preserved as-is
- [x] Missing file error handling implemented
- [x] Console logging for debugging
- [x] No changes to upload logic
- [x] No changes to database

---

## Production Considerations

### CDN Support
The fix supports future CDN integration:
- If `fileUrl` contains a complete URL (e.g., from S3/CloudFront)
- It will be used directly without modification
- No code changes needed when switching to cloud storage

### Security
- CORS already configured in backend
- Helmet middleware allows cross-origin resource policy
- Files served with proper content-type headers

### Performance
- Static file serving via Express is optimized
- Files are served directly without going through NestJS layers
- Browser caching headers can be added if needed

---

## Conclusion

✅ **Fix Complete:** HR can now view employee documents correctly  
✅ **URL Construction:** Relative paths converted to absolute backend URLs  
✅ **Error Handling:** Missing files show user-friendly error  
✅ **Future-Proof:** Supports both local storage and CDN URLs  
✅ **No Breaking Changes:** Upload and other features remain unchanged  

Documents now open correctly from:
```
http://localhost:4000/uploads/documents/{filename}
```

Instead of incorrectly from:
```
http://localhost:3000/uploads/documents/{filename}
```
