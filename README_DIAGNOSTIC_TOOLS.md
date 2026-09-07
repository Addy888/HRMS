# 🔍 HR ACTION DATA FETCH - DIAGNOSTIC TOOLS

## 🚨 CRITICAL ISSUE

The Employee HR Actions detail page shows "—" for all fields even though data exists in the database.

**I cannot fix this without seeing your actual data flow.**

---

## 🛠️ Three Diagnostic Options

### ✅ OPTION 1: Standalone HTML Tool (EASIEST)

**File:** `test-hr-action-api.html`

**How to use:**
1. Double-click `test-hr-action-api.html` 
2. Opens in your browser
3. Enter an HR Action ID from your database
4. Click "Test API"
5. Copy the **entire results** and send to me

**Advantages:**
- ✅ No server restart needed
- ✅ Works independently
- ✅ Visual results
- ✅ Copy-paste friendly

---

### ✅ OPTION 2: Next.js Diagnostic Page

**File:** `frontend/src/app/employee/hr-actions/[id]/test-api.tsx`

**How to use:**
1. Navigate to: `http://localhost:3001/employee/hr-actions/{ACTUAL_ID}/test-api`
2. Replace `{ACTUAL_ID}` with real HR Action ID
3. Open DevTools (F12) → Console tab
4. Copy all logs and the JSON on screen
5. Send to me

**Advantages:**
- ✅ Uses same API client
- ✅ Uses same authentication
- ✅ Tests exact same flow

---

### ✅ OPTION 3: Browser Console Commands

**Open browser console and run:**

```javascript
// Step 1: Get auth token
const token = localStorage.getItem('fcs_token') || 
              JSON.parse(localStorage.getItem('fcs-auth-storage') || '{}')?.state?.token;
console.log('Token:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');

// Step 2: Test API (replace YOUR_ID with actual HR Action ID)
const actionId = 'YOUR_ID_HERE';
fetch(`http://localhost:4000/api/v1/hr-actions/${actionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('HTTP Status:', r.status, r.statusText);
  return r.json();
})
.then(data => {
  console.log('===== API RESPONSE =====');
  console.log('Full Data:', data);
  console.log('Data Type:', typeof data);
  console.log('Is Array:', Array.isArray(data));
  console.log('Keys:', Object.keys(data));
  console.log('Has actionType:', data.actionType !== undefined, '→', data.actionType);
  console.log('Has subject:', data.subject !== undefined, '→', data.subject);
  console.log('Has reason:', data.reason !== undefined, '→', data.reason);
  console.log('Has incidentDate:', data.incidentDate !== undefined, '→', data.incidentDate);
  console.log('========================');
})
.catch(err => {
  console.error('ERROR:', err);
});
```

**Then send me ALL console output.**

---

## 📋 What Information I Need

Send me **ANY ONE** of these:

### Format 1: Diagnostic Tool Output
```json
{
  "actionId": "...",
  "timestamp": "...",
  "tests": {
    "auth": { ... },
    "apiCall": { ... },
    "fieldCheck": { ... }
  }
}
```

### Format 2: Console Logs
```
[2026-09-07...] Full Data: {...}
[2026-09-07...] Keys: [...]
[2026-09-07...] Has actionType: true → "WARNING"
```

### Format 3: Network Tab Response
```json
{
  "id": "...",
  "actionType": "...",
  "subject": "..."
}
```

---

## 🎯 What I'll Do With This Information

Once you send me the diagnostic output, I will:

### If response is wrapped:
```typescript
// Current
return res.data;

// Fix
return res.data.data;
```

### If field names don't match:
```typescript
// Current
action.actionType

// Fix
action.type  // or whatever the actual field name is
```

### If authentication failed:
```typescript
// Add proper error handling and user feedback
```

### If response is empty:
```typescript
// Fix the backend query to include required relations
```

---

## ⚡ Quick Start

**RIGHT NOW:**

1. Open `test-hr-action-api.html` in browser
2. Get an HR Action ID from your database
3. Run the test
4. Send me the results

**OR:**

1. Open browser console (F12)
2. Paste the JavaScript code above
3. Replace `YOUR_ID_HERE` with actual ID
4. Send me console output

---

## 🚫 Why I Cannot Fix Without Your Input

| What I Need | Why I Need It | Can I Get It Myself? |
|-------------|---------------|---------------------|
| API Response JSON | To see actual data structure | ❌ No - need your server |
| HTTP Status Code | To identify errors (401, 403, 404) | ❌ No - need your browser |
| Response Keys | To match frontend field names | ❌ No - need actual API call |
| Console Logs | To see what data was received | ❌ No - need your browser |
| Network Traffic | To debug request/response | ❌ No - need your browser |

**I literally cannot see any of this from my side.** 🙏

---

## ⏱️ Time Estimate

**With your diagnostic output:** 5-10 minutes to fix

**Without your diagnostic output:** Impossible to fix

---

## 🎯 Final Request

**Please run ONE of the three diagnostic options and send me the output.**

That's all I need to fix this issue permanently. 🚀

---

## 📞 What to Send

Just send:

```
DIAGNOSTIC OUTPUT:
[paste the JSON or console logs here]
```

I'll reply with the exact fix immediately.
