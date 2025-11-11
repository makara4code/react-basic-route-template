# ⏱️ Token Expiration Configuration Reference

Quick reference for token expiration settings in your Hono backend.

---

## 🎯 Current Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **Access Token MaxAge** | 5 minutes (300,000 ms) | Cookie expires after 5 minutes |
| **Refresh Token MaxAge** | 15 minutes (900,000 ms) | Cookie expires after 15 minutes |
| **Directus JWT Expiration** | 15 minutes (Directus default) | JWT token validity (controlled by Directus) |

---

## 🔑 Key Concepts

### **1. Cookie MaxAge vs JWT Expiration**

**Cookie MaxAge (Controlled by Hono):**
- How long the browser stores the cookie
- Set in `Set-Cookie` header: `Max-Age=300` (seconds)
- Browser automatically deletes cookie after this time
- **You control this** via `ACCESS_TOKEN_MAX_AGE` and `REFRESH_TOKEN_MAX_AGE`

**JWT Expiration (Controlled by Directus):**
- The `exp` claim inside the JWT token itself
- Directus sets this when creating the token
- Token is invalid after this time (even if cookie still exists)
- **Directus controls this** (default: 15 minutes for access tokens)

---

### **2. How Your Configuration Works**

```
Login
  ↓
Access Token Cookie (5 min) + Refresh Token Cookie (15 min)
  ↓
After 5 minutes:
  - Access token cookie EXPIRES (browser deletes it)
  - Refresh token cookie still valid (10 min remaining)
  - Next API call → 401 (no access token cookie)
  ↓
Call /auth/refresh:
  - Reads refresh token from cookie
  - Calls Directus /auth/refresh
  - Directus returns NEW JWT tokens (fresh 15-min expiration)
  - Sets NEW cookies (5 min + 15 min)
  ↓
After 15 minutes total:
  - Refresh token cookie EXPIRES
  - Cannot refresh anymore
  - User must re-login
```

---

## 📝 Environment Variables

### **Development (`server/.env`):**

```bash
# Token Expiration Configuration
ACCESS_TOKEN_MAX_AGE=300000    # 5 minutes (300,000 milliseconds)
REFRESH_TOKEN_MAX_AGE=900000   # 15 minutes (900,000 milliseconds)
```

### **Production:**

```bash
# Recommended production values
ACCESS_TOKEN_MAX_AGE=300000    # 5 minutes (short-lived for security)
REFRESH_TOKEN_MAX_AGE=900000   # 15 minutes (allows refresh window)

# Alternative: Longer sessions
ACCESS_TOKEN_MAX_AGE=900000    # 15 minutes
REFRESH_TOKEN_MAX_AGE=604800000 # 7 days
```

---

## 🔧 Customization

### **Change Expiration Times:**

Edit `server/.env`:

```bash
# Example: 10-minute access token, 30-minute refresh token
ACCESS_TOKEN_MAX_AGE=600000    # 10 minutes
REFRESH_TOKEN_MAX_AGE=1800000  # 30 minutes

# Example: 1-hour access token, 1-day refresh token
ACCESS_TOKEN_MAX_AGE=3600000   # 1 hour
REFRESH_TOKEN_MAX_AGE=86400000 # 1 day
```

**Conversion Table:**

| Time | Milliseconds |
|------|--------------|
| 1 minute | 60,000 |
| 5 minutes | 300,000 |
| 10 minutes | 600,000 |
| 15 minutes | 900,000 |
| 30 minutes | 1,800,000 |
| 1 hour | 3,600,000 |
| 1 day | 86,400,000 |
| 7 days | 604,800,000 |

---

## ⚠️ Important Notes

### **1. Cookie MaxAge Should Be ≤ JWT Expiration**

**Good:**
- Cookie MaxAge: 5 minutes
- JWT Expiration: 15 minutes
- Result: Cookie expires first, triggers refresh, gets fresh JWT ✅

**Bad:**
- Cookie MaxAge: 30 minutes
- JWT Expiration: 15 minutes
- Result: Cookie exists but JWT invalid, API calls fail ❌

**Solution:** Keep cookie MaxAge shorter than or equal to JWT expiration.

---

### **2. Refresh Token Should Live Longer Than Access Token**

**Good:**
- Access Token: 5 minutes
- Refresh Token: 15 minutes
- Result: Can refresh 3 times before re-login ✅

**Bad:**
- Access Token: 15 minutes
- Refresh Token: 5 minutes
- Result: Cannot refresh after 5 minutes ❌

**Solution:** `REFRESH_TOKEN_MAX_AGE` should be > `ACCESS_TOKEN_MAX_AGE`.

---

### **3. Directus JWT Expiration Cannot Be Changed from Hono**

**What you CAN control:**
- ✅ Cookie expiration times (via Hono config)
- ✅ When to trigger refresh (via cookie expiration)

**What you CANNOT control:**
- ❌ Directus JWT `exp` claim (set by Directus)
- ❌ Directus token validity period

**To change Directus JWT expiration:**
- Must configure Directus server environment variables
- See Directus documentation: https://docs.directus.io/self-hosted/config-options.html#authentication

---

## 🧪 Testing Your Configuration

### **Quick Test:**

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt \
  -v

# 2. Check Set-Cookie headers
# Should see:
# Set-Cookie: access_token=...; Max-Age=300; ...
# Set-Cookie: refresh_token=...; Max-Age=900; ...

# 3. Verify Max-Age values
# Access token: Max-Age=300 (5 minutes in seconds)
# Refresh token: Max-Age=900 (15 minutes in seconds)
```

---

## 📊 Recommended Configurations

### **High Security (Short Sessions):**

```bash
ACCESS_TOKEN_MAX_AGE=300000    # 5 minutes
REFRESH_TOKEN_MAX_AGE=900000   # 15 minutes
```

**Use case:** Banking apps, admin panels, sensitive data

---

### **Balanced (Medium Sessions):**

```bash
ACCESS_TOKEN_MAX_AGE=900000    # 15 minutes
REFRESH_TOKEN_MAX_AGE=3600000  # 1 hour
```

**Use case:** Most web applications, SaaS products

---

### **User-Friendly (Long Sessions):**

```bash
ACCESS_TOKEN_MAX_AGE=3600000   # 1 hour
REFRESH_TOKEN_MAX_AGE=604800000 # 7 days
```

**Use case:** Social media, content platforms, low-risk apps

---

## 🔄 How Refresh Works

### **Scenario: User stays on page for 10 minutes**

```
Time 0:00 - Login
  ├─ Access token cookie: expires at 5:00
  └─ Refresh token cookie: expires at 15:00

Time 5:00 - Access token cookie expires
  ├─ Browser deletes access token cookie
  └─ Refresh token cookie still valid

Time 5:01 - User makes API call
  ├─ No access token cookie → 401 error
  └─ Frontend should call /auth/refresh

Time 5:01 - Call /auth/refresh
  ├─ Reads refresh token from cookie
  ├─ Calls Directus /auth/refresh
  ├─ Gets NEW JWT tokens from Directus
  └─ Sets NEW cookies (expires at 10:01 and 20:01)

Time 10:00 - Access token cookie expires again
  └─ Repeat refresh process

Time 15:00 - Original refresh token expires
  └─ But new refresh token (from 5:01) expires at 20:01

Time 20:01 - All tokens expired
  └─ User must re-login
```

---

## 🚨 Common Issues

### **Issue: Tokens not expiring**

**Check:**
1. `Max-Age` in Set-Cookie header (should be in seconds, not milliseconds)
2. Browser cache (clear cookies and try again)
3. Environment variables loaded correctly (`console.log(config.accessTokenMaxAge)`)

---

### **Issue: Refresh fails immediately**

**Check:**
1. Refresh token cookie exists (`cat cookies.txt` or DevTools)
2. Refresh token not expired
3. Directus refresh endpoint working (`curl` Directus directly)

---

### **Issue: Cookie MaxAge is wrong**

**Check:** `server/src/utils/cookies.ts` line 37:
```typescript
`Max-Age=${Math.floor(maxAge / 1000)}`, // Convert ms to seconds
```

Should convert milliseconds to seconds (divide by 1000).

---

## 📚 Related Documentation

- **Testing Guide:** `REFRESH_TOKEN_TESTING_GUIDE.md`
- **Audit Report:** `REFRESH_TOKEN_AUDIT.md`
- **Implementation Recommendations:** `REFRESH_TOKEN_RECOMMENDATIONS.md`
- **Directus Auth Docs:** https://docs.directus.io/reference/authentication.html

---

**Your token expiration is now configured for 5-minute access tokens and 15-minute refresh tokens!** ⏱️

