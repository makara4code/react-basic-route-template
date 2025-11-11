# Quick Start Guide - httpOnly Cookie Authentication

This guide will help you get the new httpOnly cookie authentication system running in **5 minutes**.

## 🎯 What Changed?

### Before (localStorage)

```
React App → Directus API
- Token stored in localStorage (vulnerable to XSS)
- Manual token management
```

### After (httpOnly Cookies)

```
React App → Hono Backend → Directus API
- Token stored in httpOnly cookies (XSS-protected)
- Automatic token management
- Works on Node.js AND Edge platforms
```

## 🚀 Quick Start

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (defaults should work for development)
```

Default `.env` values:

```env
PORT=3000
NODE_ENV=development
DIRECTUS_URL=https://directus-production-7511.up.railway.app
COOKIE_SECRET=dev-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Start Backend Server

```bash
# In server/ directory
npm run dev
```

You should see:

```
🚀 Server starting on port 3000
📁 Serving static files from: ../dist
🔒 Environment: development
🌐 Directus URL: https://directus-production-7511.up.railway.app
🍪 Cookie settings: httpOnly, not secure, SameSite=Lax
✅ Server running at http://localhost:3000
```

### Step 4: Start Frontend (in new terminal)

```bash
# In project root
npm run dev
```

Frontend runs on `http://localhost:5173`

### Step 5: Test Authentication

1. Open `http://localhost:5173`
2. Navigate to `/login`
3. Login with credentials:
   - Email: `soknay@example.com`
   - Password: `123456789`
4. Check browser DevTools → Application → Cookies
5. You should see `access_token` and `refresh_token` cookies with `HttpOnly` flag ✅

## 🧪 Testing the API

### Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"soknay@example.com","password":"123456789"}' \
  -c cookies.txt -v
```

Expected response:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "soknay@example.com",
    "first_name": "Sok",
    "last_name": "Nay"
  }
}
```

Check cookies:

```bash
cat cookies.txt
```

### Test Authenticated Request

```bash
curl http://localhost:3000/auth/me \
  -b cookies.txt
```

Expected response:

```json
{
  "data": {
    "id": "...",
    "email": "soknay@example.com",
    ...
  }
}
```

### Test Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## 📁 Project Structure

```
my-react-app/
├── src/                          # React frontend
│   ├── contexts/
│   │   └── auth-context.tsx      # ✅ Updated for cookies
│   ├── components/
│   │   ├── login-form.tsx        # ✅ Updated
│   │   └── app-sidebar.tsx       # ✅ Updated
│   └── ...
├── server/                       # 🆕 New backend server
│   ├── src/
│   │   ├── app.ts               # Main Hono app
│   │   ├── index.ts             # Node.js entry
│   │   ├── worker.ts            # Cloudflare Workers entry
│   │   ├── config.ts            # Configuration
│   │   ├── middleware/          # CORS, security
│   │   ├── routes/              # Auth, proxy routes
│   │   └── utils/               # Cookie utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── vite.config.ts               # ✅ Updated proxy
├── DEPLOYMENT.md                # 🆕 Deployment guide
└── QUICKSTART.md                # 🆕 This file
```

## 🔍 Key Changes Explained

### 1. Frontend: auth-context.tsx

**Before:**

```typescript
// Stored token in localStorage
await storage.setItem("auth:token", authToken);
```

**After:**

```typescript
// Token stored in httpOnly cookie by backend
const response = await fetch("/auth/login", {
  credentials: "include", // ← Important!
});
```

### 2. Frontend: API Calls

**Before:**

```typescript
fetch("/api/users/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**After:**

```typescript
fetch("/api/users/me", {
  credentials: "include", // ← Cookie sent automatically
});
```

### 3. Backend: Cookie Management

```typescript
// Set httpOnly cookie
headers.append(
  'Set-Cookie',
  generateSetCookie('access_token', token, {
    httpOnly: true,      // ← JavaScript can't access
    secure: isProduction, // ← HTTPS only in production
    sameSite: 'Lax',     // ← CSRF protection
  })
);
```

## 🔒 Security Benefits

| Feature | localStorage | httpOnly Cookie |
|---------|-------------|-----------------|
| **XSS Protection** | ❌ Vulnerable | ✅ Protected |
| **Token Visibility** | ✅ Visible in DevTools | ❌ Hidden from JS |
| **Auto-send** | ❌ Manual | ✅ Automatic |
| **CSRF Protection** | ✅ Not needed | ✅ SameSite=Lax |

## 🐛 Common Issues

### Issue 1: Cookies Not Being Set

**Symptom:** Login succeeds but no cookies in DevTools

**Solution:**

- Check `ALLOWED_ORIGINS` includes `http://localhost:5173`
- Verify backend is running on port 3000
- Check browser console for CORS errors

### Issue 2: 401 Unauthorized

**Symptom:** API calls return 401 after login

**Solution:**

- Ensure `credentials: "include"` in fetch calls
- Check cookies exist in DevTools → Application → Cookies
- Verify backend proxy is working

### Issue 3: CORS Errors

**Symptom:** Browser blocks requests with CORS error

**Solution:**

- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart backend server after changing `.env`
- Check preflight OPTIONS requests succeed

## 📊 Verification Checklist

After setup, verify:

- [ ] Backend server running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can login successfully
- [ ] Cookies visible in DevTools with `HttpOnly` flag
- [ ] Can access protected routes (e.g., `/app/dashboard`)
- [ ] Logout clears cookies
- [ ] API calls to `/api/*` work with cookies

## 🎓 Next Steps

1. **Read the full documentation:**
   - `server/README.md` - Backend API reference
   - `DEPLOYMENT.md` - Production deployment guide

2. **Test the authentication flow:**
   - Login → Dashboard → Logout
   - Try accessing protected routes while logged out
   - Check cookie expiration behavior

3. **Customize configuration:**
   - Change cookie names
   - Adjust expiration times
   - Add custom middleware

4. **Deploy to production:**
   - Choose deployment platform (Node.js, Cloudflare, Vercel)
   - Set production environment variables
   - Test with production Directus instance

## 💡 Tips

### Development Workflow

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build

# Start production server
npm start
```

### Environment Variables

**Development:** Uses `.env` file
**Production:** Set via hosting platform

**Required in production:**

- `COOKIE_SECRET` - Strong random string
- `ALLOWED_ORIGINS` - Production frontend URL
- `NODE_ENV=production`

## 📚 Resources

- [Hono Documentation](https://hono.dev/)
- [httpOnly Cookies Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Directus API Reference](https://docs.directus.io/reference/introduction.html)

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend terminal for logs
3. Verify environment variables
4. Test with curl commands
5. Review `server/README.md` for API details

---

**Congratulations!** 🎉 You now have a secure, production-ready authentication system with httpOnly cookies that works on both Node.js and Edge platforms!
