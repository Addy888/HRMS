# MULTI-TENANT SYSTEM - QUICK TEST GUIDE

## Step-by-Step Testing

### 1. Start the Backend Server
```bash
cd backend
npm run start:dev
```

### 2. Test Platform Super Admin Login

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "platform@fcscorp.com",
  "password": "Platform@123"
}
```

**Expected Response:**
```json
{
  "requiresOtp": false,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mustChangePassword": false,
  "user": {
    "id": "...",
    "email": "platform@fcscorp.com",
    "role": "PLATFORM_SUPER_ADMIN",
    "mustChangePassword": false,
    "employee": null
  }
}
```

**✅ Success Criteria:** 
- Login successful
- Role is "PLATFORM_SUPER_ADMIN"
- No employee profile (platform admin is not an employee)

### 3. Create First Company

**Request:**
```http
POST http://localhost:3000/api/platform/organizations
Authorization: Bearer <your-platform-token>
Content-Type: application/json

{
  "name": "Test Company Ltd",
  "code": "ORG-TEST001",
  "email": "contact@testcompany.com",
  "phone": "1234567890",
  "address": "123 Test Street, Test City",
  "superAdminFirstName": "Test",
  "superAdminLastName": "Admin",
  "superAdminEmail": "admin@testcompany.com",
  "superAdminPassword": "TestAdmin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Organization and Super Admin created successfully",
  "organization": {
    "id": "...",
    "name": "Test Company Ltd",
    "code": "ORG-TEST001",
    "email": "contact@testcompany.com",
    "phone": "1234567890",
    "isActive": true
  },
  "superAdmin": {
    "id": "...",
    "email": "admin@testcompany.com",
    "firstName": "Test",
    "lastName": "Admin"
  }
}
```

**✅ Success Criteria:**
- Organization created
- Super Admin created
- Response shows both entities

### 4. View All Organizations

**Request:**
```http
GET http://localhost:3000/api/platform/organizations
Authorization: Bearer <your-platform-token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Test Company Ltd",
      "code": "ORG-TEST001",
      "email": "contact@testcompany.com",
      "isActive": true,
      "_count": {
        "users": 1,
        "employees": 0,
        "departments": 0
      }
    },
    {
      "id": "...",
      "name": "Platform Administration",
      "code": "ORG-PLATFORM",
      "_count": {
        "users": 1,
        "employees": 0,
        "departments": 0
      }
    },
    {
      "id": "...",
      "name": "Default Organization",
      "code": "ORG-DEFAULT",
      "_count": {
        "users": 3,
        "employees": 2,
        "departments": 1
      }
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**✅ Success Criteria:**
- Shows all organizations
- Includes counts for users, employees, departments

### 5. Login as Company Super Admin

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@testcompany.com",
  "password": "TestAdmin123"
}
```

**Expected Response:**
```json
{
  "requiresOtp": false,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mustChangePassword": true,
  "user": {
    "id": "...",
    "email": "admin@testcompany.com",
    "role": "SUPER_ADMIN",
    "mustChangePassword": true,
    "employee": null
  }
}
```

**✅ Success Criteria:**
- Login successful
- Role is "SUPER_ADMIN" (not PLATFORM_SUPER_ADMIN)
- Must change password on first login

### 6. Test Platform Statistics

**Request:**
```http
GET http://localhost:3000/api/platform/statistics
Authorization: Bearer <your-platform-token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalOrganizations": 3,
    "activeOrganizations": 3,
    "inactiveOrganizations": 0,
    "totalUsers": 4,
    "totalEmployees": 2,
    "totalDepartments": 1
  }
}
```

**✅ Success Criteria:**
- Shows correct counts
- Includes active/inactive breakdown

### 7. Test Organization Deactivation

**Request:**
```http
PATCH http://localhost:3000/api/platform/organizations/<org-id>/deactivate
Authorization: Bearer <your-platform-token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Organization deactivated successfully",
  "data": {
    "id": "...",
    "name": "Test Company Ltd",
    "isActive": false,
    "updatedAt": "2026-09-07T..."
  }
}
```

**✅ Success Criteria:**
- Organization deactivated
- isActive changed to false
- Users of that organization cannot login (test this!)

### 8. Test Company Super Admin Cannot Access Platform APIs

**Request:**
```http
GET http://localhost:3000/api/platform/organizations
Authorization: Bearer <company-super-admin-token>
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**✅ Success Criteria:**
- Returns 403 Forbidden
- Company Super Admin cannot access platform endpoints

### 9. Test Platform Admin Cannot Access Super Admin Endpoints

**Request:**
```http
GET http://localhost:3000/api/super-admin/dashboard
Authorization: Bearer <platform-token>
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**✅ Success Criteria:**
- Returns 403 Forbidden
- Platform admin cannot access company-specific endpoints

## Security Tests

### Test 1: Company Isolation

1. Create Company A with Super Admin A
2. Create Company B with Super Admin B
3. Login as Super Admin A
4. Try to access Company B's employees endpoint
5. **Expected:** 403 or empty results (after Phase 2)

### Test 2: IDOR Protection (After Phase 2)

1. Get an employee ID from Company A
2. Login as Company B Super Admin
3. Try `GET /api/employees/<company-a-employee-id>`
4. **Expected:** 404 Not Found or 403 Forbidden

### Test 3: Organization Filter Bypass

1. Login as Company A Super Admin
2. Try `GET /api/employees?organizationId=<company-b-id>`
3. **Expected:** Backend ignores frontend organizationId, uses JWT

## Curl Commands (Copy-Paste Ready)

### Login Platform Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "platform@fcscorp.com",
    "password": "Platform@123"
  }'
```

### Create Organization
```bash
curl -X POST http://localhost:3000/api/platform/organizations \
  -H "Authorization: Bearer YOUR_PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Company",
    "code": "ORG-DEMO",
    "email": "contact@demo.com",
    "phone": "1234567890",
    "address": "123 Demo St",
    "superAdminFirstName": "Demo",
    "superAdminLastName": "Admin",
    "superAdminEmail": "admin@demo.com",
    "superAdminPassword": "DemoPass123"
  }'
```

### List Organizations
```bash
curl -X GET http://localhost:3000/api/platform/organizations \
  -H "Authorization: Bearer YOUR_PLATFORM_TOKEN"
```

### Platform Statistics
```bash
curl -X GET http://localhost:3000/api/platform/statistics \
  -H "Authorization: Bearer YOUR_PLATFORM_TOKEN"
```

## Postman Collection

Import these endpoints into Postman:

**Collection Name:** HRMS Multi-Tenant

**Variables:**
- `base_url`: http://localhost:3000/api
- `platform_token`: (set after platform login)
- `company_token`: (set after company admin login)

**Folders:**
1. Authentication
   - Platform Login
   - Company Login
2. Platform Management
   - Create Organization
   - List Organizations
   - Get Organization
   - Update Organization
   - Activate Organization
   - Deactivate Organization
   - Platform Statistics

## Common Issues

### Issue 1: Cannot Login as Platform Admin
**Solution:** Run `npx ts-node create-platform-admin.ts` again

### Issue 2: 401 Unauthorized
**Solution:** Check if token is included in Authorization header

### Issue 3: 403 Forbidden
**Solution:** Verify you're using correct role token for the endpoint

### Issue 4: Organization code already exists
**Solution:** Use a different code (must be unique)

## Next Phase Testing (After Service Audits)

Once Phase 2 (service security audits) is complete:

1. Test Company A cannot see Company B employees
2. Test Company A cannot see Company B payroll
3. Test Company A cannot see Company B attendance
4. Test IDOR protection on all endpoints
5. Test nested resource protection
6. Test document access isolation
7. Test notification boundaries

## Success Criteria Summary

- [x] Platform admin can login
- [x] Platform admin can create organizations
- [x] Platform admin can view all organizations
- [x] Company super admin can login
- [x] Company super admin cannot access platform endpoints
- [x] Platform admin cannot access company endpoints
- [x] Organizations can be activated/deactivated
- [ ] Company data isolation verified (Phase 2)
- [ ] IDOR protection verified (Phase 2)
- [ ] All services respect organizationId (Phase 2)
