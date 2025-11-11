# 🔧 Token Debug Panel Guide

Visual debugging tool for testing and monitoring automatic token refresh.

---

## ✅ What Is It?

The **Token Debug Panel** is a floating UI component that provides real-time visibility into the automatic token refresh system. It's designed to help you:

- ✅ Monitor token refresh countdown in real-time
- ✅ Test different token expiration scenarios
- ✅ View refresh events and logs
- ✅ Verify automatic refresh is working correctly
- ✅ Debug authentication issues

**Important:** Only visible in development mode (`npm run dev`)

---

## 🎯 Features

### **1. Real-Time Monitoring**

- **Countdown Timer:** Shows time remaining until next automatic refresh (updates every second)
- **Status Indicator:** Color-coded status (green = active, yellow = expiring soon, red = expired)
- **Last Refresh Time:** Timestamp of the last successful refresh
- **Auth Status:** Current authentication state (logged in/out)
- **User Info:** Currently logged-in user email

### **2. Interactive Testing Buttons**

| Button | Action | Use Case |
|--------|--------|----------|
| **🔄 Refresh Now** | Manually trigger token refresh | Test refresh endpoint |
| **⏱️ Reset Timer** | Reset countdown to 4 minutes | Restart refresh cycle |
| **⚠️ Expire Access** | Delete access token cookie | Test 401 handling |
| **🚨 Expire All** | Delete both tokens | Test login redirect |
| **🗑️ Clear Timer** | Clear refresh timer | Stop automatic refresh |

### **3. Event Log Viewer**

- Shows last 10 refresh events
- Color-coded by type (success = green, error = red, info = blue)
- Timestamps for each event
- Scrollable log history

### **4. Keyboard Shortcut**

- **Ctrl+Shift+D** - Toggle panel open/close
- Works from anywhere in the app

---

## 🚀 How to Use

### **Step 1: Start Development Server**

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

### **Step 2: Open the Debug Panel**

**Option 1:** Click the **"🔧 Debug"** button in the bottom-right corner

**Option 2:** Press **Ctrl+Shift+D** on your keyboard

### **Step 3: Login to Your App**

1. Navigate to the login page
2. Login with your credentials
3. The debug panel will show:
   - Status: **Active** (green)
   - Countdown: **4:00** (4 minutes)
   - Auth Status: **✅ Logged In**
   - User: Your email

---

## 🧪 Testing Scenarios

### **Test 1: Monitor Automatic Refresh**

**Objective:** Verify tokens refresh automatically after 4 minutes.

**Steps:**

1. **Login** to the app
2. **Open debug panel** (Ctrl+Shift+D)
3. **Watch the countdown timer** - it should count down from 4:00
4. **Wait for countdown to reach 0:00**
5. **Make any API call** (navigate to dashboard, etc.)
6. **Check the event log:**

   ```
   ⏰ Access token close to expiring, refreshing proactively...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   ```

7. **Verify countdown resets to 4:00**

**✅ Expected Result:**

- Countdown reaches 0:00
- Next API call triggers automatic refresh
- Countdown resets to 4:00
- No errors shown to user

---

### **Test 2: Manual Refresh**

**Objective:** Test the refresh endpoint manually.

**Steps:**

1. **Login** to the app
2. **Open debug panel**
3. **Click "🔄 Refresh Now"** button
4. **Check the event log:**

   ```
   🔧 Manual refresh triggered from debug panel
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   ```

5. **Verify:**
   - "Last Refresh" timestamp updated
   - Countdown reset to 4:00
   - Status remains "Active" (green)

**✅ Expected Result:**

- Refresh succeeds
- Timer resets
- No errors

---

### **Test 3: Simulate Access Token Expiry (401 Handling)**

**Objective:** Test automatic refresh on 401 errors.

**Steps:**

1. **Login** to the app
2. **Open debug panel** (Ctrl+Shift+D)
3. **Click "⚠️ Expire Access"** button
4. **Check the event log:**

   ```
   🔧 Access token cookie deleted (simulating expiry)
   Triggering test API call to /api/users/me...
   ```

5. **Wait a moment** - the button automatically triggers a test API call
6. **Check browser console** (F12):

   ```
   🔒 Received 401 error, attempting to refresh token...
   🔄 Refreshing access token...
   ✅ Token refreshed successfully
   🔄 Retrying original request after refresh...
   ```

7. **Check debug panel event log:**

   ```
   ✅ API call succeeded (token was refreshed automatically)
   Check browser console for refresh logs
   ```

8. **Verify:**
   - API call succeeded
   - No error shown to user
   - Debug panel shows "Active" status
   - Countdown timer reset to 4:00

**✅ Expected Result:**

- 401 error caught automatically
- Token refreshed in background
- Original request retried and succeeded
- User sees success message in debug panel

---

### **Test 4: Simulate Full Token Expiry (Login Redirect)**

**Objective:** Test login redirect when refresh token expires.

**Steps:**

1. **Login** to the app
2. **Open debug panel** (Ctrl+Shift+D)
3. **Click "🚨 Expire All"** button
4. **Check the event log:**

   ```
   🔧 Both tokens deleted (simulating full expiry)
   Triggering test API call to /api/users/me...
   ```

5. **Wait a moment** - the button automatically triggers a test API call
6. **Check browser console** (F12):

   ```
   🔒 Received 401 error, attempting to refresh token...
   🔄 Refreshing access token...
   ❌ Token refresh error: ...
   ❌ Token refresh failed, redirecting to login...
   ```

7. **Verify:**
   - Redirected to `/login` page
   - Debug panel shows "Not Authenticated" (gray)
   - Can login again

**✅ Expected Result:**

- Refresh fails (no refresh token)
- User automatically redirected to login page
- Auth state cleared

---

### **Test 5: Reset Timer**

**Objective:** Test timer reset functionality.

**Steps:**

1. **Login** to the app
2. **Open debug panel**
3. **Wait 2 minutes** (countdown shows 2:00)
4. **Click "⏱️ Reset Timer"** button
5. **Check the event log:**

   ```
   ✅ Refresh timer reset
   ```

6. **Verify:**
   - Countdown resets to 4:00
   - "Last Refresh" timestamp updated
   - Status remains "Active"

**✅ Expected Result:**

- Timer resets to 4:00
- Refresh cycle restarts

---

### **Test 6: Clear Timer**

**Objective:** Test timer clearing (stop automatic refresh).

**Steps:**

1. **Login** to the app
2. **Open debug panel**
3. **Click "🗑️ Clear Timer"** button
4. **Check the event log:**

   ```
   🔧 Refresh timer cleared
   ```

5. **Verify:**
   - Countdown shows 0:00
   - Status shows "Token Expired" (red)
   - "Last Refresh" shows "Never"

**✅ Expected Result:**

- Timer cleared
- Automatic refresh disabled
- Manual refresh still works

---

## 🎨 Visual Indicators

### **Status Colors:**

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 **Green** | Active | Token valid, > 1 minute until refresh |
| 🟡 **Yellow** | Expiring Soon | < 1 minute until refresh |
| 🔴 **Red** | Token Expired | Countdown at 0:00 |
| ⚫ **Gray** | Not Authenticated | User not logged in |

### **Event Log Colors:**

| Color | Type | Example |
|-------|------|---------|
| 🟢 **Green** | Success | "✅ Token refreshed successfully" |
| 🔴 **Red** | Error | "❌ Token refresh failed" |
| 🔵 **Blue** | Info | "🔧 Access token cookie deleted" |

---

## 📊 Understanding the Display

### **Countdown Timer:**

```
Time Until Next Refresh
       4:00
  Threshold: 4:00
```

- **Top number:** Time remaining until automatic refresh
- **Threshold:** When refresh will trigger (4 minutes after last refresh)
- **Updates:** Every second

### **Info Grid:**

```
┌─────────────────┬─────────────────┐
│ Auth Status     │ Last Refresh    │
│ ✅ Logged In    │ 10:30:45 AM     │
├─────────────────┼─────────────────┤
│ Token Expiry    │ User            │
│ 5:00            │ user@email.com  │
└─────────────────┴─────────────────┘
```

- **Auth Status:** Current authentication state
- **Last Refresh:** Timestamp of last successful refresh
- **Token Expiry:** Access token cookie expiration time (5 minutes)
- **User:** Currently logged-in user email

---

## 🔍 Debugging Tips

### **Issue: Countdown not updating**

**Check:**

1. Is the panel open? (Ctrl+Shift+D)
2. Is the panel minimized? (Click ▲ to expand)
3. Check browser console for errors

**Fix:** Refresh the page

---

### **Issue: "Refresh Now" button does nothing**

**Check:**

1. Are you logged in?
2. Check browser console for errors
3. Check Network tab for `/auth/refresh` request

**Fix:**

- Ensure backend server is running (`npm run dev:server`)
- Check backend logs for errors

---

### **Issue: Status shows "Not Authenticated" but I'm logged in**

**Check:**

1. Check browser cookies (DevTools → Application → Cookies)
2. Look for `access_token` and `refresh_token` cookies
3. Check if cookies are for correct domain

**Fix:**

- Logout and login again
- Clear cookies and login again

---

### **Issue: Countdown shows 0:00 immediately after login**

**Cause:** Refresh timer not reset after login.

**Fix:**

1. Click "⏱️ Reset Timer" button
2. Or logout and login again

**Prevention:** This should be automatic - check `auth-context.tsx` calls `resetRefreshTimer()` after login.

---

## ⚙️ Configuration

### **Change Refresh Threshold:**

Edit `src/lib/axios.ts`:

```typescript
// Current: Refresh at 4 minutes (1 min before 5 min expiry)
const REFRESH_BUFFER = 1 * 60 * 1000;

// Option 1: Refresh at 3 minutes (2 min before expiry)
const REFRESH_BUFFER = 2 * 60 * 1000;

// Option 2: Refresh at 10 seconds (for fast testing)
const REFRESH_BUFFER = 4 * 60 * 1000 + 50 * 1000;
```

**After changing:** Rebuild and restart dev server.

---

### **Disable Debug Panel:**

The panel is automatically hidden in production builds.

To manually disable in development, comment out in `src/App.tsx`:

```typescript
// <TokenDebugPanel />
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/components/TokenDebugPanel.tsx` | Debug panel component |
| `src/lib/axios.ts` | Axios instance with interceptors |
| `src/App.tsx` | App component (includes debug panel) |
| `src/hooks/use-auth.ts` | Auth hook |

---

## 🎯 Quick Reference

### **Keyboard Shortcuts:**

- **Ctrl+Shift+D** - Toggle debug panel

### **Button Actions:**

- **🔄 Refresh Now** - Manual refresh
- **⏱️ Reset Timer** - Reset to 4:00
- **⚠️ Expire Access** - Delete access token
- **🚨 Expire All** - Delete all tokens
- **🗑️ Clear Timer** - Stop automatic refresh

### **Status Colors:**

- 🟢 Green = Active
- 🟡 Yellow = Expiring soon
- 🔴 Red = Expired
- ⚫ Gray = Not authenticated

---

## ✅ Checklist

Before deploying to production:

- [ ] Test all 6 scenarios above
- [ ] Verify countdown updates every second
- [ ] Verify automatic refresh at 4 minutes
- [ ] Verify 401 handling works
- [ ] Verify login redirect works
- [ ] Verify event logs are accurate
- [ ] Verify panel is hidden in production build

---

**The Token Debug Panel makes it easy to test and verify your automatic token refresh implementation!** 🎉
