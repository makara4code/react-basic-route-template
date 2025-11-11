# 🧪 Refresh Token Testing Guide

This guide provides step-by-step instructions for testing the refresh token functionality with your new configuration.

---

## 📋 Configuration Summary

### **New Token Expiration Settings:**

| Token Type | Cookie MaxAge | Purpose |
|------------|---------------|---------|
| **Access Token** | 5 minutes (300,000 ms) | Short-lived, triggers refresh |
| **Refresh Token** | 15 minutes (900,000 ms) | Allows refresh within window |

### **How It Works:**

1. **User logs in** → Access token cookie (5 min) + Refresh token cookie (15 min)
2. **After 5 minutes** → Access token cookie expires (browser deletes it)
3. **Next API call** → No access token → Backend should trigger refresh
4. **Refresh endpoint called** → Gets new JWT from Directus → Sets new cookies
5. **After 15 minutes** → Refresh token cookie expires → User must re-login

---

## 🔧 Configuration Files Modified

### **1. `server/.env`**

```bash
# Token Expiration Configuration
ACCESS_TOKEN_MAX_AGE=300000    # 5 minutes
REFRESH_TOKEN_MAX_AGE=900000   # 15 minutes
COOKIE_MAX_AGE=300000          # Legacy (backward compatibility)
```

### **2. `server/src/config.ts`**

```typescript
// Token expiration times (in milliseconds)
accessTokenMaxAge: parseInt(
  process.env.ACCESS_TOKEN_MAX_AGE || "300000", // 5 minutes
  10
),
refreshTokenMaxAge: parseInt(
  process.env.REFRESH_TOKEN_MAX_AGE || "900000", // 15 minutes
  10
),
```

### **3. `server/src/routes/auth.ts`**

Updated to use `config.accessTokenMaxAge` and `config.refreshTokenMaxAge` instead of `config.cookieMaxAge`.

---

## 🧪 Testing Strategy

### **Test 1: Normal Login Flow**

**Objective:** Verify tokens are set with correct expiration times.

**Steps:**

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Login via curl:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt \
     -v
   ```

3. **Check Set-Cookie headers:**
   ```
   Set-Cookie: access_token=...; Path=/; Max-Age=300; SameSite=Lax; HttpOnly
   Set-Cookie: refresh_token=...; Path=/; Max-Age=900; SameSite=Lax; HttpOnly
   ```

4. **Verify Max-Age values:**
   - Access token: `Max-Age=300` (5 minutes)
   - Refresh token: `Max-Age=900` (15 minutes)

**✅ Expected Result:**
- Login successful
- Cookies set with correct Max-Age values
- User data returned in response

---

### **Test 2: Access Token Expiration (Manual)**

**Objective:** Simulate access token expiration and verify refresh works.

**Steps:**

1. **Login first:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt
   ```

2. **Verify access token works:**
   ```bash
   curl http://localhost:3000/auth/me \
     -b cookies.txt
   ```
   **Expected:** User data returned (200 OK)

3. **Manually delete access token from cookies.txt:**
   ```bash
   # Edit cookies.txt and remove the line with "access_token"
   # Keep the "refresh_token" line
   ```

4. **Try to access protected endpoint:**
   ```bash
   curl http://localhost:3000/auth/me \
     -b cookies.txt
   ```
   **Expected:** 401 Unauthorized (no access token)

5. **Call refresh endpoint:**
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -b cookies.txt \
     -c cookies.txt \
     -v
   ```
   **Expected:** 
   - 200 OK with `{"success":true}`
   - New access_token and refresh_token cookies set

6. **Retry protected endpoint:**
   ```bash
   curl http://localhost:3000/auth/me \
     -b cookies.txt
   ```
   **Expected:** User data returned (200 OK)

**✅ Expected Result:**
- Refresh endpoint successfully generates new tokens
- Protected endpoints work after refresh

---

### **Test 3: Access Token Expiration (Wait 5 Minutes)**

**Objective:** Verify access token cookie actually expires after 5 minutes.

**Steps:**

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt
   ```

2. **Immediately test access:**
   ```bash
   curl http://localhost:3000/auth/me -b cookies.txt
   ```
   **Expected:** 200 OK

3. **Wait 5 minutes** (set a timer)

4. **Check cookies.txt:**
   ```bash
   cat cookies.txt
   ```
   **Expected:** Access token cookie should be gone (browser would delete it)

5. **Try to access protected endpoint:**
   ```bash
   curl http://localhost:3000/auth/me -b cookies.txt
   ```
   **Expected:** 401 Unauthorized

6. **Call refresh endpoint:**
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -b cookies.txt \
     -c cookies.txt
   ```
   **Expected:** 200 OK with new tokens

**✅ Expected Result:**
- Access token cookie expires after 5 minutes
- Refresh token still valid
- Refresh endpoint works

---

### **Test 4: Refresh Token Expiration (Wait 15 Minutes)**

**Objective:** Verify refresh token expires after 15 minutes and user must re-login.

**Steps:**

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt
   ```

2. **Wait 15 minutes** (set a timer)

3. **Try to refresh:**
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -b cookies.txt
   ```
   **Expected:** 401 Unauthorized (refresh token expired or missing)

4. **Try to access protected endpoint:**
   ```bash
   curl http://localhost:3000/auth/me -b cookies.txt
   ```
   **Expected:** 401 Unauthorized

5. **Must re-login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt
   ```
   **Expected:** 200 OK with new tokens

**✅ Expected Result:**
- Refresh token expires after 15 minutes
- Refresh endpoint fails
- User must re-login

---

### **Test 5: Browser Testing (DevTools)**

**Objective:** Test in real browser environment.

**Steps:**

1. **Start dev servers:**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   npm run dev:server
   ```

2. **Open browser:** `http://localhost:5173`

3. **Open DevTools:** F12 → Application → Cookies → `http://localhost:3000`

4. **Login** via the UI

5. **Check cookies:**
   - `access_token` - Expires in ~5 minutes
   - `refresh_token` - Expires in ~15 minutes

6. **Wait 5 minutes** and watch cookies:
   - Access token should disappear
   - Refresh token should still exist

7. **Make an API call** (navigate to dashboard)
   - Should get 401 error (no automatic refresh yet)

8. **Manually call refresh:**
   ```javascript
   // In browser console
   fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```

9. **Check cookies again:**
   - New access_token should appear
   - New refresh_token should appear

**✅ Expected Result:**
- Cookies expire at correct times
- Manual refresh works
- New cookies set after refresh

---

### **Test 6: Concurrent Refresh Requests**

**Objective:** Verify only one refresh happens when multiple requests fail simultaneously.

**Steps:**

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"soknay@example.com","password":"123456789"}' \
     -c cookies.txt
   ```

2. **Delete access token from cookies.txt**

3. **Make multiple simultaneous requests:**
   ```bash
   # Run these in parallel (different terminals)
   curl http://localhost:3000/auth/me -b cookies.txt &
   curl http://localhost:3000/api/users/me -b cookies.txt &
   curl http://localhost:3000/api/items/articles -b cookies.txt &
   ```

4. **Check server logs:**
   - Should see multiple 401 errors
   - Should NOT see multiple refresh attempts (no automatic refresh yet)

**✅ Expected Result:**
- Multiple 401 errors logged
- No automatic refresh (as expected - not implemented yet)

---

## 🔍 Verification Checklist

After running all tests, verify:

- [ ] Access token cookie expires after 5 minutes
- [ ] Refresh token cookie expires after 15 minutes
- [ ] `/auth/refresh` endpoint works correctly
- [ ] New tokens are set after successful refresh
- [ ] Refresh fails after 15 minutes (refresh token expired)
- [ ] User must re-login after refresh token expires
- [ ] Cookies have correct `Max-Age` values in Set-Cookie headers
- [ ] httpOnly, Secure (production), and SameSite flags are set correctly

---

## 🐛 Troubleshooting

### **Issue: Cookies not expiring**

**Cause:** Browser may cache cookies or ignore Max-Age.

**Solution:**
- Clear all cookies in DevTools
- Use Incognito/Private mode
- Check `Max-Age` value in Set-Cookie header (should be in seconds, not milliseconds)

---

### **Issue: Refresh endpoint returns 401**

**Possible causes:**
1. **Refresh token cookie missing** → Check cookies.txt or DevTools
2. **Refresh token expired** → Re-login
3. **Directus refresh token invalid** → Check Directus logs

**Debug:**
```bash
# Check what cookies are being sent
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -v
```

---

### **Issue: Max-Age is in milliseconds instead of seconds**

**Cause:** Cookie `Max-Age` must be in **seconds**, not milliseconds.

**Check:** `server/src/utils/cookies.ts` line 37:
```typescript
`Max-Age=${Math.floor(maxAge / 1000)}`, // Convert ms to seconds
```

**Verify:** Set-Cookie header should show:
- `Max-Age=300` (5 minutes = 300 seconds) ✅
- NOT `Max-Age=300000` ❌

---

## 📊 Expected Server Logs

### **Successful Login:**
```
[INFO] POST /auth/login 200 - 234ms
[INFO] Login successful: soknay@example.com
```

### **Successful Refresh:**
```
[INFO] POST /auth/refresh 200 - 123ms
[INFO] Token refresh successful
```

### **Failed Refresh (No Token):**
```
[WARN] No refresh token found for: /auth/refresh
[WARN] POST /auth/refresh 401 - 2ms
```

### **Failed Refresh (Invalid Token):**
```
[WARN] Token refresh failed
[WARN] POST /auth/refresh 401 - 156ms
```

---

## 🎯 Next Steps

After verifying all tests pass:

1. **✅ Configuration is correct** - Tokens expire at desired times
2. **⚠️ Automatic refresh NOT implemented** - Users will see 401 errors after 5 minutes
3. **📝 Recommendation:** Implement automatic refresh (see `REFRESH_TOKEN_RECOMMENDATIONS.md`)

---

## 🚀 Production Deployment

Before deploying to production:

1. **Update environment variables:**
   ```bash
   ACCESS_TOKEN_MAX_AGE=300000    # 5 minutes
   REFRESH_TOKEN_MAX_AGE=900000   # 15 minutes
   NODE_ENV=production
   COOKIE_SECRET=<strong-random-secret>
   ```

2. **Test in production-like environment:**
   - Set `NODE_ENV=production` locally
   - Verify `Secure` flag is set on cookies
   - Test with HTTPS (use ngrok or similar)

3. **Monitor logs:**
   - Watch for token refresh success/failure
   - Monitor 401 error rates
   - Check for refresh token expiration patterns

---

**Your refresh token configuration is now set to 5-minute access tokens and 15-minute refresh tokens!** 🎉

