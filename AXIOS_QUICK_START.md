# ⚡ Axios Auto-Refresh Quick Start

Quick reference for the automatic token refresh implementation.

---

## ✅ What Was Implemented

Your React + Hono app now has **automatic token refresh** using axios interceptors!

### **Key Features:**

✅ **Proactive Refresh** - Refreshes tokens 1 minute before expiry (at 4 minutes)  
✅ **Reactive Refresh** - Catches 401 errors and auto-refreshes  
✅ **Retry Logic** - Automatically retries failed requests after refresh  
✅ **Concurrent Handling** - Prevents multiple simultaneous refresh requests  
✅ **Graceful Failure** - Redirects to login if refresh fails  

---

## 📁 Files Changed

| File | Status | Changes |
|------|--------|---------|
| `src/lib/axios.ts` | 🆕 NEW | Axios instance with interceptors |
| `src/contexts/auth-context.tsx` | ✏️ MODIFIED | Uses axios instead of fetch |
| `package.json` | ✏️ MODIFIED | Added axios dependency |

---

## 🚀 How to Use

### **1. Import axios in your components:**

```typescript
import axios from "@/lib/axios";

// Make API calls
const response = await axios.get("/api/users/me");
const data = response.data;
```

### **2. All API calls automatically include:**

- ✅ Credentials (httpOnly cookies)
- ✅ Automatic token refresh
- ✅ 401 error handling
- ✅ Request retry after refresh

---

## 🔄 How It Works

### **Timeline:**

```
0:00 - Login
  └─ Refresh timer starts

4:00 - Make API call
  ├─ Interceptor: "Token close to expiring, refreshing..."
  ├─ Calls /auth/refresh
  ├─ Gets new tokens
  └─ Original request proceeds

8:00 - Make API call
  └─ Refreshes again automatically

15:00 - Refresh token expires
  └─ Redirects to login
```

---

## 🧪 Quick Test

### **Test Proactive Refresh:**

1. **Start servers:**
   ```bash
   npm run dev          # Frontend (Terminal 1)
   npm run dev:server   # Backend (Terminal 2)
   ```

2. **Login** at `http://localhost:5173`

3. **Open console** (F12)

4. **Wait 4 minutes** (or modify `REFRESH_BUFFER` for faster testing)

5. **Navigate to dashboard**

6. **Check console:**
   ```
   ⏰ Access token close to expiring, refreshing proactively...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   ```

---

### **Test Reactive Refresh (401 Handling):**

1. **Login** to the app

2. **DevTools** → Application → Cookies → Delete `access_token`

3. **Navigate to dashboard**

4. **Check console:**
   ```
   🔒 Received 401 error, attempting to refresh token...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   🔄 Retrying original request after refresh...
   ```

5. **Result:** Dashboard loads successfully (no error shown to user)

---

## ⚙️ Configuration

### **Adjust Refresh Timing:**

Edit `src/lib/axios.ts`:

```typescript
// Current: Refresh at 4 minutes (1 min before 5 min expiry)
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000;
const REFRESH_BUFFER = 1 * 60 * 1000;

// Option 1: Refresh at 3 minutes (2 min before expiry)
const REFRESH_BUFFER = 2 * 60 * 1000;

// Option 2: Refresh at 4:30 (30 sec before expiry)
const REFRESH_BUFFER = 30 * 1000;
```

---

### **Fast Testing (10 Second Refresh):**

```typescript
// Temporarily change for testing:
const REFRESH_BUFFER = 4 * 60 * 1000 + 50 * 1000; // Refresh after 10 sec
```

**Then:**
1. Login
2. Wait 10 seconds
3. Make API call → Should see refresh in console

**Don't forget to change back!**

---

## 🎯 Usage Examples

### **Example 1: Fetch User Data**

```typescript
import axios from "@/lib/axios";

const fetchUser = async () => {
  try {
    const response = await axios.get("/api/users/me");
    console.log(response.data);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

---

### **Example 2: Create Item**

```typescript
import axios from "@/lib/axios";

const createItem = async (data: any) => {
  try {
    const response = await axios.post("/api/items", data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
```

---

### **Example 3: Update Item**

```typescript
import axios from "@/lib/axios";

const updateItem = async (id: string, data: any) => {
  try {
    const response = await axios.patch(`/api/items/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
```

---

## 🔍 Debugging

### **Check Refresh Timer:**

```typescript
import { getTimeUntilRefresh } from "@/lib/axios";

console.log("Time until refresh:", getTimeUntilRefresh(), "ms");
```

---

### **Reset Refresh Timer Manually:**

```typescript
import { resetRefreshTimer } from "@/lib/axios";

resetRefreshTimer();
console.log("Refresh timer reset");
```

---

### **Clear Refresh Timer:**

```typescript
import { clearRefreshTimer } from "@/lib/axios";

clearRefreshTimer();
console.log("Refresh timer cleared");
```

---

## 📊 Console Logs Reference

### **Successful Proactive Refresh:**

```
⏰ Access token close to expiring, refreshing proactively...
🔄 Refreshing access token...
✅ Token refreshed successfully
```

---

### **Successful Reactive Refresh:**

```
🔒 Received 401 error, attempting to refresh token...
🔄 Refreshing access token...
✅ Token refreshed successfully
🔄 Retrying original request after refresh...
```

---

### **Refresh Failure:**

```
🔄 Refreshing access token...
❌ Token refresh error: ...
❌ Token refresh failed, redirecting to login...
```

---

## ⚠️ Important Notes

### **1. Don't Use Plain fetch() for API Calls**

**❌ Bad:**
```typescript
const response = await fetch("/api/users/me", {
  credentials: "include",
});
```

**✅ Good:**
```typescript
import axios from "@/lib/axios";

const response = await axios.get("/api/users/me");
```

---

### **2. External APIs Can Still Use fetch()**

```typescript
// This is fine (external API, not your backend)
const response = await fetch("https://jsonplaceholder.typicode.com/posts");
```

---

### **3. Auth Endpoints Skip Interceptors**

These endpoints are excluded from interceptors:
- `/auth/login`
- `/auth/logout`
- `/auth/refresh`

This prevents infinite loops.

---

## 🐛 Common Issues

### **Issue: "Token not refreshing"**

**Check:**
1. Console logs - is interceptor running?
2. `REFRESH_THRESHOLD` - is it correct?
3. `lastRefreshTime` - is it set after login?

**Fix:** Add debug logs in `src/lib/axios.ts`

---

### **Issue: "Multiple refresh requests"**

**Cause:** `isRefreshing` flag not working.

**Fix:** Check that `isRefreshing` is properly set in interceptors.

---

### **Issue: "Infinite refresh loop"**

**Cause:** `/auth/refresh` returning 401.

**Fix:** Ensure `/auth/refresh` is excluded in response interceptor.

---

## 📚 Full Documentation

For detailed information, see:

- **Implementation Guide:** `AXIOS_AUTO_REFRESH_IMPLEMENTATION.md`
- **Token Configuration:** `TOKEN_EXPIRATION_CONFIG.md`
- **Testing Guide:** `REFRESH_TOKEN_TESTING_GUIDE.md`

---

## ✅ Checklist

Before deploying to production:

- [ ] Test proactive refresh (wait 4 minutes)
- [ ] Test reactive refresh (delete access token)
- [ ] Test concurrent requests
- [ ] Test refresh failure (delete both tokens)
- [ ] Verify console logs are correct
- [ ] Check Network tab for refresh requests
- [ ] Test on production environment
- [ ] Monitor refresh success/failure rates

---

**Your automatic token refresh is ready! Users will have a seamless authentication experience.** 🎉

