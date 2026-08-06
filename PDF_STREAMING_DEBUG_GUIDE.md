# PDF Streaming Debug Guide

## Problem
Browser shows: "We can't open this file" even though backend logs show file found and streaming.

## Root Cause Analysis

### Possible Issues:
1. **Uploaded file is not a valid PDF** - File corrupted during upload
2. **Response headers incorrect** - Missing Content-Type or Content-Length
3. **Stream not ending properly** - Connection hangs or incomplete data
4. **Global interceptor interfering** - Modifying binary response
5. **File is empty** - 0 bytes uploaded

## Backend Debugging Added

### 1. Upload Validation ✅

**Added to `company-policies.service.ts`:**

```typescript
// Read first 5 bytes to verify PDF header
const buffer = Buffer.alloc(5);
const fd = fs.openSync(file.path, 'r');
fs.readSync(fd, buffer, 0, 5, 0);
fs.closeSync(fd);

const header = buffer.toString('utf-8');
console.log('File header:', header);

if (header !== '%PDF-') {
  console.error('❌ Invalid PDF file! Header:', header);
  fs.unlinkSync(file.path); // Delete invalid file
  throw new BadRequestException('Uploaded file is not a valid PDF');
}

console.log('✅ Valid PDF file confirmed');
```

**What it does:**
- Reads first 5 bytes of uploaded file
- Checks if it starts with `%PDF-`
- Rejects upload if not a valid PDF
- Deletes invalid file immediately

### 2. View Endpoint Enhanced Debugging ✅

**Added to `company-policies.controller.ts`:**

```typescript
console.log('\n=== PDF VIEW REQUEST ===');
console.log('Policy ID:', id);

// 1. Check file exists
const fs = await import('fs');
if (!fs.existsSync(filePath)) {
  console.error('❌ File not found');
  throw new NotFoundException('Policy file not found');
}

// 2. Get file stats
const stats = fs.statSync(filePath);
console.log('✓ File Size:', stats.size, 'bytes');

if (stats.size === 0) {
  console.error('❌ File is empty (0 bytes)');
  throw new NotFoundException('Policy file is empty');
}

// 3. Verify PDF header
const buffer = Buffer.alloc(5);
const fd = fs.openSync(filePath, 'r');
fs.readSync(fd, buffer, 0, 5, 0);
fs.closeSync(fd);

const header = buffer.toString('utf-8');
console.log('✓ PDF Header:', header);

if (header !== '%PDF-') {
  console.error('❌ Invalid PDF header:', header);
  throw new NotFoundException('File is not a valid PDF');
}

console.log('✅ Valid PDF file confirmed');

// 4. Set proper headers
const headers = {
  'Content-Type': 'application/pdf',
  'Content-Length': stats.size.toString(),
  'Content-Disposition': `inline; filename="${policy.fileName}"`,
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'Accept-Ranges': 'bytes',
};

console.log('✓ Headers:', headers);

Object.entries(headers).forEach(([key, value]) => {
  res.setHeader(key, value);
});

console.log('✅ Headers set');
console.log('✅ Streaming PDF to client...');

// 5. Stream with event logging
const fileStream = createReadStream(filePath);

fileStream.on('error', (error) => {
  console.error('❌ Stream error:', error);
});

fileStream.on('open', () => {
  console.log('✅ Stream opened');
});

fileStream.on('end', () => {
  console.log('✅ Stream finished');
});

fileStream.on('close', () => {
  console.log('✅ Stream closed');
});

return new StreamableFile(fileStream);
```

## Expected Console Output (Success)

### Upload:
```
=== Uploading Company Policy ===
File details: {
  originalname: 'Company_Policy_2024.pdf',
  filename: 'policy-1234567890-123456789.pdf',
  path: 'uploads\\company-policies\\policy-1234567890-123456789.pdf',
  size: 245678,
  mimetype: 'application/pdf'
}
File header: %PDF-
✅ Valid PDF file confirmed
DTO: { policyName: 'Company Policy 2024', version: '1.0' }
Created policy in DB: {
  id: 'uuid-here',
  fileUrl: 'uploads\\company-policies\\policy-1234567890-123456789.pdf',
  fileSize: 245678
}
✅ Auto-assigned to 10 employees
```

### View:
```
=== PDF VIEW REQUEST ===
Policy ID: uuid-here
Policy fileUrl from DB: uploads\company-policies\policy-1234567890-123456789.pdf
Normalized path: uploads/company-policies/policy-1234567890-123456789.pdf
Full file path: C:\Users\...\HRMS\backend\uploads\company-policies\policy-1234567890-123456789.pdf
Process cwd: C:\Users\...\HRMS\backend
✅ File found
✓ File Size: 245678 bytes
✓ PDF Header: %PDF-
✅ Valid PDF file confirmed
✓ Headers: {
  'Content-Type': 'application/pdf',
  'Content-Length': '245678',
  'Content-Disposition': 'inline; filename="Company_Policy_2024.pdf"',
  ...
}
✅ Headers set
✅ Streaming PDF to client...
✅ Stream opened
✅ Stream finished
✅ Stream closed
```

## Expected Console Output (Errors)

### Invalid PDF Upload:
```
=== Uploading Company Policy ===
File details: { ... }
File header: ��ࡱ
❌ Invalid PDF file! Header: ��ࡱ
```
**Response:** 400 Bad Request - "Uploaded file is not a valid PDF"

### File Not Found:
```
=== PDF VIEW REQUEST ===
Policy ID: uuid-here
...
❌ File not found at path: C:\...\policy-123.pdf
```
**Response:** 404 Not Found

### Empty File:
```
=== PDF VIEW REQUEST ===
...
✓ File Size: 0 bytes
❌ File is empty (0 bytes)
```
**Response:** 404 Not Found

### Corrupted PDF:
```
=== PDF VIEW REQUEST ===
...
✓ File Size: 12345 bytes
✓ PDF Header: <html
❌ Invalid PDF header: <html
Expected: %PDF-
```
**Response:** 404 Not Found

## Manual Testing Steps

### Step 1: Test Upload
1. Start backend: `npm run start:dev`
2. Login as HR
3. Upload a PDF file
4. Check console logs for:
   - ✅ Valid PDF file confirmed
   - File size > 0
   - File path stored

### Step 2: Verify File on Disk
```bash
cd backend
dir uploads\company-policies
```
Expected: File exists with size > 0 bytes

### Step 3: Open File Manually
```bash
start uploads\company-policies\policy-*.pdf
```
Expected: PDF opens in default PDF viewer

**If PDF doesn't open manually:**
- File is corrupt
- Upload process is broken
- Re-upload required

### Step 4: Test API Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/company-policies/POLICY_ID/view \
  --output test.pdf
```

Then open `test.pdf`:
```bash
start test.pdf
```

**If PDF opens:** ✅ Backend is streaming correctly
**If PDF doesn't open:** ❌ Backend is corrupting the stream

### Step 5: Check Browser Network Tab
1. Open DevTools → Network
2. Navigate to policy viewer
3. Find `/company-policies/ID/view` request
4. Check:
   - Status: 200 OK
   - Content-Type: application/pdf
   - Content-Length: matches file size
   - Response: shows PDF binary data (starts with `%PDF-`)

### Step 6: Check Browser Console
Expected logs:
```
✅ Policy loaded
📄 Fetching PDF from backend...
✅ PDF response received, converting to blob...
✅ Blob created: 245678 bytes, type: application/pdf
✅ Blob URL created
```

## Response Header Verification

### Required Headers:
```
Content-Type: application/pdf
Content-Length: 245678
Content-Disposition: inline; filename="policy.pdf"
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
X-Content-Type-Options: nosniff
Accept-Ranges: bytes
```

### Verify in Browser:
1. Network tab → Select request
2. Headers tab → Response Headers
3. Confirm all headers present

## Common Issues and Fixes

### Issue 1: "We can't open this file"
**Cause:** Uploaded file is not a valid PDF
**Fix:** 
- Backend now validates PDF header during upload
- Only files starting with `%PDF-` are accepted
- Re-upload the file

### Issue 2: Empty response
**Cause:** File is 0 bytes or doesn't exist
**Fix:**
- Check file exists: `dir uploads\company-policies`
- Check file size > 0
- Re-upload if needed

### Issue 3: Partial download
**Cause:** Stream interrupted
**Fix:**
- Check backend logs for stream errors
- Verify full stream: open → end → close events logged
- Check network stability

### Issue 4: Wrong Content-Type
**Cause:** Headers not set correctly
**Fix:**
- Backend now explicitly sets `Content-Type: application/pdf`
- Verify in Network tab Response Headers

### Issue 5: HTML error page instead of PDF
**Cause:** Exception thrown, error handler returns JSON/HTML
**Fix:**
- Backend validates before streaming
- Throws NotFoundException early if invalid
- No streaming if validation fails

## File Validation Checklist

Before streaming, backend now checks:
- ✅ Policy record exists in database
- ✅ fileUrl field is not null
- ✅ Physical file exists on disk
- ✅ File size > 0 bytes
- ✅ First 5 bytes = `%PDF-`
- ✅ All headers set correctly
- ✅ Stream opens successfully
- ✅ Stream finishes without errors

## Debugging Workflow

```
1. Upload PDF
   ↓
2. Check console: "✅ Valid PDF file confirmed"
   ↓
3. Verify file on disk
   ↓
4. Open file manually from Windows
   ↓ (If opens)
5. Test API endpoint with curl
   ↓ (If works)
6. Test in browser
   ↓ (If fails)
7. Check browser console
   ↓
8. Check Network tab
   ↓
9. Verify blob creation logs
   ↓
10. Check for JavaScript errors
```

## Success Indicators

### Backend Console:
- ✅ Valid PDF file confirmed (upload)
- ✅ File found (view)
- ✓ File Size: XXXX bytes
- ✓ PDF Header: %PDF-
- ✅ Headers set
- ✅ Streaming PDF to client
- ✅ Stream opened
- ✅ Stream finished
- ✅ Stream closed

### Browser Console:
- ✅ Policy loaded
- ✅ PDF response received
- ✅ Blob created: XXXX bytes
- ✅ Blob URL created

### Browser Display:
- ✅ PDF visible in iframe
- ✅ Can scroll through pages
- ✅ No error messages

## Next Steps After Debugging

1. **If upload validation fails:**
   - User needs to upload actual PDF file
   - Not Word doc, image, or other format

2. **If file doesn't exist on disk:**
   - Check multer configuration
   - Check uploads directory permissions
   - Check disk space

3. **If file is corrupted:**
   - Problem with upload process
   - Check multer middleware
   - Check file size limits

4. **If streaming fails:**
   - Check for global interceptors
   - Check for exception filters
   - Check NestJS response transformation

5. **If browser can't display:**
   - Check blob creation in frontend
   - Check iframe src attribute
   - Check for CORS issues
   - Check for console errors

## Final Verification

After implementing fixes, verify:

1. ✅ Upload a PDF → Console shows "Valid PDF confirmed"
2. ✅ File appears in uploads folder
3. ✅ Open file manually → PDF displays
4. ✅ API request returns 200 OK
5. ✅ Content-Type is application/pdf
6. ✅ Content-Length matches file size
7. ✅ Response body starts with %PDF-
8. ✅ Browser console shows blob created
9. ✅ PDF displays in browser
10. ✅ No error messages

**Status:** Ready for testing with actual PDF upload
