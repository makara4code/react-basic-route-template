# 🚀 Axios Auto-Refresh Implementation Guide

This document explains the automatic token refresh implementation using axios interceptors.

---

## ✅ Implementation Complete

Your Hono + React application now has **automatic token refresh** using axios interceptors!

---

## 🎯 Features Implemented

### **1. Proactive Token Refresh**

- ✅ Automatically refreshes tokens **before** they expire (4 minutes after login)
- ✅ Prevents 401 errors by refreshing proactively
- ✅ Seamless user experience - no interruptions

### **2. Reactive Token Refresh (401 Handling)**

- ✅ Catches 401 errors from API calls
- ✅ Automatically calls `/auth/refresh` endpoint
- ✅ Retries the failed request with new token
- ✅ Redirects to login if refresh fails

### **3. Concurrent Request Handling**

- ✅ Prevents multiple simultaneous refresh requests
- ✅ Queues requests during refresh
- ✅ All requests succeed after single refresh

### **4. Automatic Cleanup**

- ✅ Resets refresh timer after login
- ✅ Clears refresh timer after logout
- ✅ Handles refresh failures gracefully

---

## 📁 Files Created/Modified

### **1. `src/lib/axios.ts` (NEW)**

**Purpose:** Axios instance with automatic token refresh interceptors

**Key Features:**

- Request interceptor: Proactive refresh before expiration
- Response interceptor: Reactive refresh on 401 errors
- Concurrent request handling
- Automatic redirect on refresh failure

**Configuration:**

```typescript
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_BUFFER = 1 * 60 * 1000;      // Refresh 1 minute before expiry
const REFRESH_THRESHOLD = 4 * 60 * 1000;   // Refresh at 4 minutes
```

---

### **2. `src/contexts/auth-context.tsx` (MODIFIED)**

**Changes:**

- ✅ Replaced `fetch()` with `axios`
- ✅ Added `resetRefreshTimer()` after login
- ✅ Added `clearRefreshTimer()` after logout
- ✅ Simplified error handling (axios throws on non-2xx)

**Before:**

```typescript
const response = await fetch("/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});

if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error || "Login failed");
}

const data = await response.json();
```

**After:**

```typescript
const response = await axios.post("/auth/login", {
  email,
  password,
});

const data = response.data;
resetRefreshTimer(); // Start automatic refresh
```

---

## 🔄 How It Works

### **Scenario 1: Proactive Refresh (Before Expiration)**

```
Time 0:00 - User logs in
  ├─ Access token cookie: expires at 5:00
  ├─ Refresh timer starts
  └─ lastRefreshTime = 0:00

Time 4:00 - User makes API call
  ├─ Request interceptor checks: timeSinceLastRefresh = 4 min
  ├─ 4 min >= REFRESH_THRESHOLD (4 min) → Refresh needed!
  ├─ Calls /auth/refresh automatically
  ├─ Gets new tokens from Directus
  ├─ Sets new cookies (expires at 9:00)
  ├─ Updates lastRefreshTime = 4:00
  └─ Original API call proceeds with new token

Time 8:00 - User makes another API call
  ├─ Request interceptor checks: timeSinceLastRefresh = 4 min
  ├─ Refreshes again automatically
  └─ Continues seamlessly...
```

**✅ Result:** User never sees 401 errors, tokens always fresh!

---

### **Scenario 2: Reactive Refresh (401 Error)**

```
Time 0:00 - User logs in
  └─ Access token cookie: expires at 5:00

Time 5:01 - Access token cookie expires (browser deletes it)

Time 5:02 - User makes API call
  ├─ No access token cookie → Backend returns 401
  ├─ Response interceptor catches 401
  ├─ Calls /auth/refresh automatically
  ├─ Gets new tokens from Directus
  ├─ Sets new cookies
  ├─ Retries original API call
  └─ Original API call succeeds!

User sees: Nothing! Request succeeded transparently.
```

**✅ Result:** Even if proactive refresh fails, reactive refresh handles it!

---

### **Scenario 3: Concurrent Requests**

```
Time 4:00 - User makes 3 API calls simultaneously
  ├─ Request 1: Checks refresh → Starts refreshing
  ├─ Request 2: Checks refresh → Waits for Request 1's refresh
  ├─ Request 3: Checks refresh → Waits for Request 1's refresh
  └─ All 3 requests proceed after single refresh

Result: Only 1 refresh request, all 3 API calls succeed!
```

**✅ Result:** Efficient, no duplicate refresh requests!

---

### **Scenario 4: Refresh Failure**

```
Time 15:00 - Refresh token expires

Time 15:01 - User makes API call
  ├─ Proactive refresh triggered
  ├─ Calls /auth/refresh
  ├─ Backend returns 401 (refresh token expired)
  ├─ handleRefreshFailure() called
  ├─ Clears refresh timer
  └─ Redirects to /login?redirect=/current-page

User sees: Login page with message "Your session has expired"
```

**✅ Result:** Graceful handling, user can re-login and return to page!

---

## 🧪 Testing the Implementation

### **Test 1: Proactive Refresh**

**Objective:** Verify tokens refresh automatically after 4 minutes.

**Steps:**

1. **Start dev servers:**

   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   npm run dev:server
   ```

2. **Open browser:** `http://localhost:5173`

3. **Login** with your credentials

4. **Open browser console** (F12)

5. **Wait 4 minutes** (or modify `REFRESH_THRESHOLD` to 10 seconds for faster testing)

6. **Make any API call** (navigate to dashboard, etc.)

7. **Check console logs:**

   ```
   ⏰ Access token close to expiring, refreshing proactively...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   ```

8. **Check Network tab:**
   - Should see `POST /auth/refresh` request
   - Status: 200 OK
   - Response: `{"success":true}`

**✅ Expected Result:**

- Token refreshes automatically after 4 minutes
- No 401 errors
- User doesn't notice anything

---

### **Test 2: Reactive Refresh (401 Handling)**

**Objective:** Verify 401 errors trigger automatic refresh.

**Steps:**

1. **Login** to the app

2. **Open DevTools** → Application → Cookies → `http://localhost:3000`

3. **Delete `access_token` cookie** (keep `refresh_token`)

4. **Navigate to dashboard** or make any API call

5. **Check console logs:**

   ```
   🔒 Received 401 error, attempting to refresh token...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   🔄 Retrying original request after refresh...
   ```

6. **Check Network tab:**
   - Original request: 401 Unauthorized
   - `/auth/refresh`: 200 OK
   - Retry of original request: 200 OK

**✅ Expected Result:**

- 401 error caught automatically
- Token refreshed
- Original request retried and succeeded
- User sees correct data (no error)

---

### **Test 3: Concurrent Requests**

**Objective:** Verify only one refresh happens for multiple simultaneous requests.

**Steps:**

1. **Login** to the app

2. **Delete `access_token` cookie** in DevTools

3. **Quickly navigate to multiple pages** or make multiple API calls

4. **Check Network tab:**
   - Multiple 401 errors
   - **Only ONE** `/auth/refresh` request
   - All original requests retried and succeeded

**✅ Expected Result:**

- Only one refresh request
- All API calls succeed after refresh

---

### **Test 4: Refresh Failure (Expired Refresh Token)**

**Objective:** Verify graceful handling when refresh token expires.

**Steps:**

1. **Login** to the app

2. **Delete both `access_token` and `refresh_token` cookies** in DevTools

3. **Navigate to dashboard** or make any API call

4. **Check console logs:**

   ```
   🔒 Received 401 error, attempting to refresh token...
   🔄 Refreshing access token...
   ❌ Token refresh error: ...
   ❌ Token refresh failed, redirecting to login...
   ```

5. **Check browser:**
   - Redirected to `/login?redirect=/app/dashboard`

**✅ Expected Result:**

- Refresh fails (no refresh token)
- User redirected to login page
- Return URL preserved in query string

---

### **Test 5: Fast Testing (Modified Threshold)**

**For faster testing, temporarily modify `src/lib/axios.ts`:**

```typescript
// Change from:
const REFRESH_BUFFER = 1 * 60 * 1000; // 1 minute

// To:
const REFRESH_BUFFER = 4 * 60 * 1000 + 50 * 1000; // 4 min 50 sec (refresh after 10 sec)
```

**Then:**

1. Login
2. Wait 10 seconds
3. Make API call
4. Should see proactive refresh in console

**Don't forget to change it back after testing!**

---

## 🔧 Configuration Options

### **Adjust Refresh Timing:**

Edit `src/lib/axios.ts`:

```typescript
// Current: Refresh 1 minute before expiry (at 4 minutes)
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_BUFFER = 1 * 60 * 1000;      // 1 minute buffer

// Option 1: Refresh 2 minutes before expiry (at 3 minutes)
const REFRESH_BUFFER = 2 * 60 * 1000;      // 2 minute buffer

// Option 2: Refresh 30 seconds before expiry (at 4:30)
const REFRESH_BUFFER = 30 * 1000;          // 30 second buffer
```

---

### **Disable Proactive Refresh (Only Reactive):**

Comment out the proactive refresh logic in request interceptor:

```typescript
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip refresh for auth endpoints
    if (config.url?.includes("/auth/")) {
      return config;
    }

    // COMMENT OUT THIS SECTION to disable proactive refresh
    /*
    if (shouldRefreshToken()) {
      // ... proactive refresh logic
    }
    */

    return config;
  }
);
```

**Result:** Only refreshes on 401 errors (reactive only)

---

## 📊 Comparison: Before vs After

| Feature | Before (fetch) | After (axios) |
|---------|---------------|---------------|
| **Automatic refresh** | ❌ No | ✅ Yes |
| **Proactive refresh** | ❌ No | ✅ Yes (4 min) |
| **401 handling** | ❌ Shows error | ✅ Auto-refresh + retry |
| **Concurrent requests** | ❌ Multiple refreshes | ✅ Single refresh |
| **User experience** | ⚠️ Sees 401 errors | ✅ Seamless |
| **Code complexity** | ✅ Simple | ⚠️ More complex |
| **Maintenance** | ✅ Easy | ⚠️ Moderate |

---

## 🐛 Troubleshooting

### **Issue: Refresh not triggering**

**Check:**

1. `lastRefreshTime` is set correctly (check console logs)
2. `REFRESH_THRESHOLD` is correct (4 minutes)
3. Request interceptor is running (add console.log)

**Debug:**

```typescript
// Add to src/lib/axios.ts request interceptor
console.log("Time since last refresh:", Date.now() - lastRefreshTime);
console.log("Refresh threshold:", REFRESH_THRESHOLD);
console.log("Should refresh?", shouldRefreshToken());
```

---

### **Issue: Multiple refresh requests**

**Cause:** `isRefreshing` flag not working correctly.

**Fix:** Check that `isRefreshing` is set to `true` before refresh and `false` after.

---

### **Issue: Infinite refresh loop**

**Cause:** `/auth/refresh` endpoint returning 401, triggering another refresh.

**Fix:** Ensure `/auth/refresh` is excluded in response interceptor:

```typescript
if (originalRequest.url?.includes("/auth/refresh")) {
  return Promise.reject(error);
}
```

---

## 🎯 Next Steps

1. **✅ Test thoroughly** using the test scenarios above
2. **✅ Monitor console logs** for refresh events
3. **✅ Adjust timing** if needed (REFRESH_BUFFER)
4. **✅ Deploy to production** and monitor

---

## 📚 Related Documentation

- **Configuration:** `TOKEN_EXPIRATION_CONFIG.md`
- **Testing:** `REFRESH_TOKEN_TESTING_GUIDE.md`
- **Audit:** `REFRESH_TOKEN_AUDIT.md`

---

**Your application now has automatic token refresh with axios interceptors! Users will have a seamless authentication experience with no unexpected logouts.** 🎉
