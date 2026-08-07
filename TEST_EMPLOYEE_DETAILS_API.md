# Testing Employee Details API - Step by Step Guide

## Prerequisites
1. Backend must be running on port 3001
2. You must have an HR account JWT token
3. You must have at least one employee created in the system

## Step 1: Start the Backend

Open a terminal and run:
```bash
cd backend
npm run start:dev
```

**Expected Output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/api/v1/employees, GET} route
[Nest] INFO [RoutesResolver] Mapped {/api/v1/employees/:id, GET} route
[Nest] INFO [NestApplication] Nest application successfully started
```

✅ **Backend should start WITHOUT compilation errors**

## Step 2: Get HR Token

### Option A: Use Existing Token
If you already have an HR token from login, use that.

### Option B: Login to Get New Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"hr@company.com\",\"password\":\"yourpassword\"}"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "hr@company.com",
    "role": "HR"
  }
}
```

Copy the `access_token` value for next steps.

## Step 3: Get List of Employees

```bash
curl -X GET http://localhost:3001/api/v1/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "employee-uuid-here",
      "employeeId": "FCS-2026-0001",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "departmentName": "Engineering",
      "designationTitle": "Senior Developer",
      "profileCompletion": 85,
      "documentsCount": 5,
      "isActive": true,
      "joiningDate": "2026-01-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

✅ **Copy the `id` field (employee-uuid-here) from any employee**

## Step 4: Get Employee Details

Replace `EMPLOYEE_ID` with the ID copied from Step 3:

```bash
curl -X GET http://localhost:3001/api/v1/employees/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Response Structure:
```json
{
  "id": "employee-uuid",
  "employeeId": "FCS-2026-0001",
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dob": "1990-05-15T00:00:00.000Z",
  "gender": "Male",
  "bloodGroup": "O+",
  "address": "123 Main St",
  "emergencyContact": "Jane Doe: +0987654321",
  "joiningDate": "2026-01-15T00:00:00.000Z",
  "departmentId": "dept-uuid",
  "designationId": "desig-uuid",
  "monthlySalary": 50000,
  "onboardingStatus": "DOCUMENTS_UPLOADED",
  
  "email": "john.doe@company.com",
  "isActive": true,
  "userCreatedAt": "2026-01-10T00:00:00.000Z",
  "roleName": "EMPLOYEE",
  "departmentName": "Engineering",
  "designationTitle": "Senior Developer",
  "profileCompletion": 85,
  "fullName": "John Doe",
  "documentsCount": 5,
  
  "documentsByCategory": {
    "personal": [
      {
        "id": "doc-uuid-1",
        "type": "RESUME",
        "fileName": "john_resume.pdf",
        "fileUrl": "/uploads/documents/...",
        "status": "APPROVED",
        "createdAt": "2026-01-20T00:00:00.000Z"
      },
      {
        "id": "doc-uuid-2",
        "type": "PHOTO",
        "fileName": "john_photo.jpg",
        "fileUrl": "/uploads/documents/...",
        "status": "APPROVED",
        "createdAt": "2026-01-20T00:00:00.000Z"
      }
    ],
    "government": [
      {
        "id": "doc-uuid-3",
        "type": "AADHAAR",
        "fileName": "aadhaar.pdf",
        "fileUrl": "/uploads/documents/...",
        "status": "APPROVED",
        "createdAt": "2026-01-21T00:00:00.000Z"
      },
      {
        "id": "doc-uuid-4",
        "type": "PAN",
        "fileName": "pan.pdf",
        "fileUrl": "/uploads/documents/...",
        "status": "PENDING",
        "createdAt": "2026-01-21T00:00:00.000Z"
      }
    ],
    "education": [
      {
        "id": "doc-uuid-5",
        "type": "10TH_MARKSHEET",
        "fileName": "10th_marksheet.pdf",
        "fileUrl": "/uploads/documents/...",
        "status": "APPROVED",
        "createdAt": "2026-01-22T00:00:00.000Z"
      }
    ],
    "professional": [],
    "other": []
  },
  
  "user": {
    "id": "user-uuid",
    "email": "john.doe@company.com",
    "isActive": true,
    "createdAt": "2026-01-10T00:00:00.000Z",
    "role": {
      "id": "role-uuid",
      "name": "EMPLOYEE"
    }
  },
  
  "department": {
    "id": "dept-uuid",
    "name": "Engineering",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  
  "designation": {
    "id": "desig-uuid",
    "name": "Senior Developer",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  
  "profile": {
    "id": "profile-uuid",
    "profileCompletion": 85,
    "createdAt": "2026-01-10T00:00:00.000Z",
    "updatedAt": "2026-01-25T00:00:00.000Z"
  },
  
  "documents": [
    // All documents in flat array (same as in documentsByCategory)
  ],
  
  "education": [],
  "experience": []
}
```

### Check Backend Console Logs

When you make the request, backend should print:
```
╔══════════════════════════════════════════════════════════╗
║  findOne() called for Employee Details                   ║
╚══════════════════════════════════════════════════════════╝
📋 Employee ID received: employee-uuid
📋 Employee ID type: string
📋 Employee ID length: 36
✅ Employee FOUND in database
📊 Employee Data Summary:
   - Employee ID (Code): FCS-2026-0001
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@company.com
   - Phone: +1234567890
   - Department: Engineering
   - Designation: Senior Developer
   - Joining Date: 2026-01-15T00:00:00.000Z
   - Documents Count: 5
   - Profile Completion: 85 %
   - Is Active: true
   - Created At: 2026-01-10T00:00:00.000Z

📁 Documents Found:
   1. Type: RESUME, Status: APPROVED, File: john_resume.pdf
   2. Type: PHOTO, Status: APPROVED, File: john_photo.jpg
   3. Type: AADHAAR, Status: APPROVED, File: aadhaar.pdf
   4. Type: PAN, Status: PENDING, File: pan.pdf
   5. Type: 10TH_MARKSHEET, Status: APPROVED, File: 10th_marksheet.pdf
╚══════════════════════════════════════════════════════════╝
```

## Step 5: Get Employee Documents (Alternative Endpoint)

```bash
curl -X GET http://localhost:3001/api/v1/documents/employee/EMPLOYEE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": "doc-uuid-1",
    "employeeId": "employee-uuid",
    "type": "RESUME",
    "fileUrl": "/uploads/documents/...",
    "fileName": "john_resume.pdf",
    "status": "APPROVED",
    "categoryId": "cat-uuid",
    "createdAt": "2026-01-20T00:00:00.000Z",
    "updatedAt": "2026-01-20T00:00:00.000Z",
    "employeeName": "John Doe",
    "employeeCode": "FCS-2026-0001",
    "departmentId": "dept-uuid",
    "departmentName": "Engineering",
    "designationId": "desig-uuid",
    "designationName": "Senior Developer",
    "mimeType": "application/pdf",
    "category": {
      "id": "cat-uuid",
      "name": "PERSONAL"
    },
    "verification": {
      "id": "ver-uuid",
      "documentId": "doc-uuid-1",
      "verifiedBy": "HR Admin",
      "comment": "Approved",
      "verifiedAt": "2026-01-21T00:00:00.000Z"
    },
    "versions": [
      {
        "id": "ver-uuid-1",
        "documentId": "doc-uuid-1",
        "version": 1,
        "fileUrl": "/uploads/documents/...",
        "fileName": "john_resume.pdf",
        "createdAt": "2026-01-20T00:00:00.000Z"
      }
    ]
  }
]
```

## Validation Checklist

### ✅ Response Should Have:
- [ ] `fullName` is NOT "undefined undefined"
- [ ] `email` is NOT empty (should be employee email)
- [ ] `phone` is NOT empty (if provided)
- [ ] `departmentName` is NOT empty (if department assigned)
- [ ] `designationTitle` is NOT empty (if designation assigned)
- [ ] `joiningDate` is NOT empty
- [ ] `profileCompletion` is a number (0-100)
- [ ] `documentsCount` matches number of uploaded documents
- [ ] `documentsByCategory` has 5 keys: personal, government, education, professional, other
- [ ] Each document has `type`, `fileName`, `fileUrl`, `status`
- [ ] `isActive` is boolean (true/false)

### ❌ Response Should NOT Have:
- [ ] NO "undefined" strings anywhere
- [ ] NO null for fields that have values in database
- [ ] NO empty objects where data exists
- [ ] NO compilation errors in backend console

## Troubleshooting

### Issue: "Employee not found"
**Solution:** 
- Verify the employee ID is correct (copy from Step 3)
- Ensure employee exists in database

### Issue: HTTP 401 Unauthorized
**Solution:**
- Verify JWT token is correct
- Token should start with "Bearer " in Authorization header
- Token might be expired, get new token from login

### Issue: HTTP 403 Forbidden
**Solution:**
- Ensure you're using HR account token
- Employee role cannot access `/api/v1/employees/:id` endpoint

### Issue: Backend not responding
**Solution:**
- Check if backend is running: `npm run start:dev`
- Check for compilation errors in terminal
- Verify port 3001 is not in use by another process

### Issue: Fields still showing "undefined"
**Solution:**
1. Check backend logs for the detailed employee data
2. Verify the response JSON structure matches expected format
3. If backend shows correct data but frontend shows undefined:
   - Issue is in frontend data mapping
   - Frontend needs to use flattened fields (e.g., `employeeDetails.email` not `employeeDetails.user.email`)

## Success Criteria

✅ **Backend compiles without errors**
✅ **API returns complete employee data**
✅ **All fields have proper values (no undefined)**
✅ **Documents are fetched and grouped correctly**
✅ **Backend logs show detailed information**
✅ **Profile completion is calculated**

If all checkmarks pass, the backend is working correctly and the issue must be in frontend data mapping.
