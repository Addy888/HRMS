# Backend Diagnostic Report - Notification & WebSocket Issues

## Status: LOGGING ENABLED - AWAITING FRONTEND REQUESTS

The backend has been instrumented with comprehensive logging to diagnose two failures:
1. `GET /api/v1/notifications/unread` returns HTTP 500
2. Socket.IO connection fails with websocket error

---

## Task 1: Notification /unread Endpoint Diagnostic

### Files Modified:

#### 1. Controller: `notifications.controller.ts`
**Location:** `backend/src/modules/notifications/notifications.controller.ts`  
**Line:** 60-83

**Added Logging:**
```typescript
@Get('unread')
async getUnreadCount(@GetUser('id') userId: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 NOTIFICATION CONTROLLER: /unread endpoint hit');
  console.log('   Authenticated User ID:', userId);
  console.log('   Timestamp:', new Date().toISOString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const result = await this.notificationService.getUnreadCount(userId);
    console.log('✅ NOTIFICATION CONTROLLER: Successfully retrieved');
    console.log('   Result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('❌ NOTIFICATION CONTROLLER: Error in /unread');
    console.error('   User ID:', userId);
    console.error('   Error Name:', error.name);
    console.error('   Error Message:', error.message);
    console.error('   Error Stack:', error.stack);
    throw error;
  }
}
```

#### 2. Service: `notification.service.ts`
**Location:** `backend/src/modules/notifications/notification.service.ts`  
**Line:** 289-339

**Added Logging:**
```typescript
async getUnreadCount(userId: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 NOTIFICATION SERVICE: getUnreadCount() entered');
  console.log('   User ID:', userId);
  console.log('   Timestamp:', new Date().toISOString());
  
  try {
    console.log('📊 NOTIFICATION SERVICE: Executing Prisma query...');
    console.log('   Query: notificationRecipient.count()');
    console.log('   Where: { userId:', userId, ', read: false }');
    
    const count = await this.prisma.notificationRecipient.count({
      where: { userId, read: false },
    });
    
    console.log('✅ NOTIFICATION SERVICE: Prisma query successful');
    console.log('   Unread count:', count);
    console.log('   Returning: { count:', count, '}');
    
    return { count };
  } catch (error) {
    console.error('❌ NOTIFICATION SERVICE: Prisma query failed');
    console.error('   User ID:', userId);
    console.error('   Error Type:', error.constructor.name);
    console.error('   Error Name:', error.name);
    console.error('   Error Message:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   Error Meta:', JSON.stringify(error.meta || {}, null, 2));
    console.error('   Full Error:', error);
    console.error('   Stack Trace:', error.stack);
    
    this.logger.error(
      `Failed to get unread count for user ${userId}: ${error.message}`,
      error.stack,
    );
    
    throw error;
  }
}
```

### Diagnostic Information Captured:
- ✅ Controller entry point
- ✅ Authenticated user ID from JWT
- ✅ Service method entry
- ✅ Prisma query details (table, where clause)
- ✅ Query result or error
- ✅ Full error stack trace
- ✅ Prisma-specific error codes and metadata

---

## Task 2: Socket.IO WebSocket Diagnostic

### Files Modified:

#### Gateway: `socket.gateway.ts`
**Location:** `backend/src/modules/notifications/socket.gateway.ts`  
**Line:** 31-150

**Gateway Configuration:**
```typescript
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
})
```

**Configuration Details:**
- ✅ **Namespace:** `/notifications`
- ✅ **CORS Origins:** `http://localhost:3000`, `http://localhost:3001`
- ✅ **Credentials:** Enabled
- ✅ **Transports:** WebSocket primary, polling fallback

**Added Comprehensive Logging:**
```typescript
async handleConnection(client: Socket) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔌 SOCKET GATEWAY: Connection attempt');
  console.log('   Socket ID:', client.id);
  console.log('   Client Address:', client.handshake.address);
  console.log('   Transport:', client.conn.transport.name);
  
  console.log('🔐 SOCKET GATEWAY: Checking authentication');
  console.log('   Auth object:', JSON.stringify(client.handshake.auth));
  console.log('   Query object:', JSON.stringify(client.handshake.query));
  console.log('   Headers:', JSON.stringify(client.handshake.headers));
  
  console.log('🎫 SOCKET GATEWAY: Token extracted');
  console.log('🔓 SOCKET GATEWAY: Verifying JWT token...');
  console.log('✅ SOCKET GATEWAY: JWT verified successfully');
  console.log('   Payload:', JSON.stringify(payload));
  
  console.log('👤 SOCKET GATEWAY: Extracted user ID:', userId);
  console.log('💾 SOCKET GATEWAY: Fetching user from database...');
  console.log('📦 SOCKET GATEWAY: User query result');
  
  console.log('✅ SOCKET GATEWAY: Associating socket with user');
  console.log('🚪 SOCKET GATEWAY: Joining rooms...');
  console.log('📡 SOCKET GATEWAY: Emitting "connected" event');
  console.log('✅ SOCKET GATEWAY: Connection successful');
}
```

### Diagnostic Information Captured:
- ✅ Socket ID
- ✅ Client IP address
- ✅ Transport method (websocket/polling)
- ✅ Auth payload (token from handshake.auth)
- ✅ Query parameters (token from handshake.query)
- ✅ HTTP headers
- ✅ JWT verification status
- ✅ JWT payload (user ID, role, etc.)
- ✅ User database lookup result
- ✅ Room join operations
- ✅ Connection success/failure with reason
- ✅ Full error stack if connection fails

### Authentication Flow:
1. Extract token from `client.handshake.auth.token` OR `client.handshake.query.token`
2. Handle `Bearer <token>` format
3. Verify JWT with secret
4. Extract user ID from `payload.sub`
5. Lookup user in database with role and employee relations
6. Join user to personal, role, department, and designation rooms
7. Emit `connected` event with authentication status

### Connection Handler:
- ✅ `handleConnection()` - Logs every connection attempt
- ✅ `handleDisconnect()` - Logs disconnections

---

## Backend Status

### Server Running:
```
✅ Backend running on: http://localhost:4000/api/v1
✅ Compilation successful: 0 errors
✅ All routes registered
```

### Notification Routes:
```
✅ GET /api/v1/notifications/unread
✅ GET /api/v1/notifications
✅ PATCH /api/v1/notifications/read-all
✅ PATCH /api/v1/notifications/:id/read
✅ DELETE /api/v1/notifications/:id
```

### Socket.IO Gateway:
```
✅ Namespace: /notifications
✅ Connection handler: Active
✅ Disconnect handler: Active
✅ JWT verification: Enabled
✅ Room management: Configured
```

---

## Next Steps - AWAITING FRONTEND REQUESTS

### To Diagnose Issue #1 (GET /notifications/unread):
**Action Required:** Access the frontend at `http://localhost:3000` with an authenticated user.

**Expected Logs When Request is Made:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 NOTIFICATION CONTROLLER: /unread endpoint hit
   Authenticated User ID: <user-uuid>
   Timestamp: 2026-08-07T...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 NOTIFICATION SERVICE: getUnreadCount() entered
   User ID: <user-uuid>
   Timestamp: 2026-08-07T...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 NOTIFICATION SERVICE: Executing Prisma query...
   Query: notificationRecipient.count()
   Where: { userId: <user-uuid>, read: false }
```

**If Error Occurs, Logs Will Show:**
```
❌ NOTIFICATION SERVICE: Prisma query failed
   User ID: <user-uuid>
   Error Type: PrismaClientKnownRequestError
   Error Name: PrismaClientKnownRequestError
   Error Message: <exact error message>
   Error Code: P2002 (or other Prisma code)
   Error Meta: { target: [...], cause: "..." }
   Full Error: <complete error object>
   Stack Trace: <full stack>
```

### To Diagnose Issue #2 (Socket.IO Connection):
**Action Required:** Frontend attempts to connect to WebSocket.

**Expected Logs When Connection Attempt:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 SOCKET GATEWAY: Connection attempt
   Socket ID: <socket-id>
   Timestamp: 2026-08-07T...
   Client Address: ::1 (or 127.0.0.1)
   Transport: websocket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SOCKET GATEWAY: Checking authentication
   Auth object: { "token": "eyJ..." }
   Query object: {}
   Headers: { ... }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 SOCKET GATEWAY: Token extracted: eyJ...
🔓 SOCKET GATEWAY: Verifying JWT token...
✅ SOCKET GATEWAY: JWT verified successfully
   Payload: { "sub": "<user-id>", "email": "...", ... }
```

**If Error Occurs, Logs Will Show:**
```
❌ SOCKET GATEWAY: Connection rejected - <reason>
   Socket ID: <socket-id>
   Auth payload: <payload>
   Query params: <params>
   Error Type: <error-type>
   Error Message: <exact-message>
   Stack Trace: <full-stack>
```

---

## What Will Be Revealed:

### For `/notifications/unread` Failure:
1. **Exact Prisma error code** (P2002, P2025, etc.)
2. **Database query failure reason** (missing table, constraint violation, etc.)
3. **User ID causing the issue**
4. **Line number in service where it fails**
5. **Full error stack trace**

### For Socket Connection Failure:
1. **Token presence/absence** in auth payload
2. **JWT verification failure reason** (invalid signature, expired, malformed)
3. **User lookup failure** (user not found, inactive)
4. **Connection rejection reason**
5. **Transport method** (websocket vs polling)
6. **Client address and socket ID**

---

## Files Modified Summary:

```
✅ backend/src/modules/notifications/notifications.controller.ts
   - Added comprehensive logging to /unread endpoint
   - Try/catch with full error logging

✅ backend/src/modules/notifications/notification.service.ts
   - Added logging to getUnreadCount() method
   - Prisma query logging
   - Full error capture with Prisma-specific fields

✅ backend/src/modules/notifications/socket.gateway.ts
   - Added logging to handleConnection()
   - Auth flow logging (token, JWT, user lookup)
   - Room join logging
   - Connection success/failure logging
```

---

## Action Required:

**Please access the frontend and trigger the failures:**

1. **For notification error:**
   - Navigate to any authenticated page
   - The frontend will automatically call `/api/v1/notifications/unread`
   - Check backend terminal for detailed error logs

2. **For socket error:**
   - Frontend will attempt WebSocket connection on page load
   - Check backend terminal for connection attempt logs

**Once errors occur, the backend logs will reveal:**
- Exact exception type
- Controller file and line number
- Service file and line number
- Prisma query details
- Socket connection failure reason
- Full error stack traces

**The diagnostic report will be ready immediately after the frontend makes these requests.**
