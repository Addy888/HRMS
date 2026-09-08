# 🧪 ATTENDANCE UPLOAD - TEST GUIDE

## Quick Test Commands

### Test 1: Check Backend is Running
```bash
curl http://localhost:4000/api/v1/health
```
**Expected**: API responds

### Test 2: Verify Confirm Endpoint Schema
The `/api/v1/attendance/import/confirm` endpoint now accepts:

```json
{
  "sessionId": "import_1788869081276_xxx"
}
```

**Note**: `fileId` is now optional and can be omitted.

## Full Upload Flow Test

### Step 1: Login as HR
1. Open browser: http://localhost:3000
2. Login with HR credentials
3. Navigate to HR → Attendance

### Step 2: Upload Excel
1. Click "Upload Excel" button
2. Select any .xlsx or .xls file
3. Click "Upload"

### Step 3: Verify Success
✅ No error message about "fileId should not be empty"
✅ Success message: "Attendance Excel uploaded successfully"
✅ Modal closes automatically after 3 seconds
✅ File appears in "Uploaded Attendance" section

### Step 4: Check Upload History
1. Click "Upload History" button
2. Verify the uploaded file appears with:
   - Correct file name
   - Your name as uploader
   - Current date & time
   - Status: "Uploaded Successfully"

### Step 5: Verify Database
Check that the import was saved:

```sql
-- Check import history
SELECT * FROM "AttendanceImportHistory" 
ORDER BY "uploadedAt" DESC 
LIMIT 5;

-- Check raw attendance records
SELECT * FROM "RawAttendanceRecord" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## Expected Network Requests

### Request 1: Upload File
```
POST http://localhost:4000/api/v1/attendance/import/preview
Content-Type: multipart/form-data
Body: file = [Excel file]

Response 200:
{
  "totalRows": 50,
  "validRows": 45,
  "invalidRows": 0,
  "duplicateRows": 5,
  "employeesFound": 45,
  "employeesNotFound": 5,
  "results": [...],
  "warnings": [...],
  "sessionId": "import_1788869081276_aesewf"
}
```

### Request 2: Confirm Import (THIS WAS BROKEN, NOW FIXED)
```
POST http://localhost:4000/api/v1/attendance/import/confirm
Content-Type: application/json
Body: {
  "sessionId": "import_1788869081276_aesewf"
}

Response 200:
{
  "success": true,
  "importHistoryId": "uuid-here",
  "totalRows": 50,
  "successfulRows": 45,
  "failedRows": 0,
  "matchedEmployees": 45,
  "unmatchedRecords": 5
}
```

### Request 3: Fetch History
```
GET http://localhost:4000/api/v1/attendance/import/history?page=1&limit=5

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "fileName": "attendance.xlsx",
      "uploadedByUser": {
        "email": "hr@example.com",
        "employee": {
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "uploadedAt": "2026-09-08T12:00:00Z",
      "totalRows": 50,
      "successfulRows": 45,
      "failedRows": 0,
      "duplicateRows": 5,
      "status": "COMPLETED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

## Browser Console Check

Open browser DevTools (F12) and check the Network tab:

### Before Fix (Error) ❌
```
POST /api/v1/attendance/import/confirm
Status: 400 Bad Request
Response: {
  "message": [
    "fileId should not be empty",
    "fileId must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### After Fix (Success) ✅
```
POST /api/v1/attendance/import/confirm
Status: 200 OK
Response: {
  "success": true,
  "importHistoryId": "...",
  "totalRows": 50,
  "successfulRows": 45,
  "failedRows": 0
}
```

## Troubleshooting

### Issue: Still getting "fileId should not be empty"
**Solution**: 
1. Restart backend server
2. Clear browser cache
3. Verify backend is using the updated code:
   ```bash
   cd backend
   npm run build
   npm run start:dev
   ```

### Issue: Upload history is empty
**Solution**:
1. Check database connection
2. Verify AttendanceImportHistory table exists:
   ```bash
   cd backend
   npx prisma db push
   ```

### Issue: Modal doesn't close automatically
**Solution**:
- This is normal - check if success message appears
- Close manually if needed
- The upload still succeeded if you see the success icon

### Issue: File doesn't appear in history
**Solution**:
1. Manually refresh the page
2. Check backend logs for errors
3. Verify the import was saved to database

## Test with cURL (Advanced)

```bash
# Get auth token first
TOKEN="your-jwt-token-here"

# Test preview endpoint
curl -X POST http://localhost:4000/api/v1/attendance/import/preview \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/attendance.xlsx"

# Test confirm endpoint (use sessionId from above)
curl -X POST http://localhost:4000/api/v1/attendance/import/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "import_1788869081276_xxx"}'

# Test history endpoint
curl -X GET "http://localhost:4000/api/v1/attendance/import/history?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

## Success Criteria

✅ Upload Excel without errors
✅ Confirm request succeeds (200 OK)
✅ No "fileId should not be empty" error
✅ Success message shows in UI
✅ File appears in upload history
✅ Data saved to RawAttendanceRecord table
✅ HR can view upload history
✅ Employee can see uploaded attendance (if matched)

## Test Complete! 🎉

If all success criteria are met, the fix is working correctly.
