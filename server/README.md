# Backend Server - Hono with httpOnly Cookie Authentication

This is a flexible backend server built with **Hono** that works on both **Node.js** and **Edge platforms** (Cloudflare Workers, Vercel Edge, etc.).

## 🎯 Features

- ✅ **httpOnly Cookie Authentication** - Secure token storage
- ✅ **Directus API Proxy** - Seamless integration with Directus backend
- ✅ **Static File Serving** - Serves React build files
- ✅ **Platform Agnostic** - Works on Node.js, Cloudflare Workers, Vercel Edge
- ✅ **TypeScript** - Full type safety
- ✅ **Security Headers** - CORS, CSP, HSTS, etc.
- ✅ **Auto Token Refresh** - Refresh token support

## 📁 Project Structure

```
server/
├── src/
│   ├── app.ts              # Main Hono application
│   ├── index.ts            # Node.js entry point
│   ├── worker.ts           # Cloudflare Workers entry point
│   ├── config.ts           # Configuration management
│   ├── middleware/
│   │   ├── cors.ts         # CORS middleware
│   │   └── security.ts     # Security headers middleware
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   └── proxy.ts        # Directus API proxy
│   └── utils/
│       └── cookies.ts      # Cookie utilities
├── package.json
├── tsconfig.json
├── wrangler.toml           # Cloudflare Workers config
├── .env                    # Environment variables
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
DIRECTUS_URL=https://directus-production-7511.up.railway.app
COOKIE_SECRET=your-super-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Build React Frontend

```bash
cd ../
npm run build
```

This creates `dist/` folder with production build.

### 4. Run Development Server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:3000`

### 5. Run Production Server

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication

#### POST /auth/login
Login with email and password. Sets httpOnly cookies.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Cookies Set:**
- `access_token` (httpOnly, secure in production)
- `refresh_token` (httpOnly, secure in production)

---

#### POST /auth/logout
Logout and clear cookies.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /auth/refresh
Refresh access token using refresh token from cookie.

**Response:**
```json
{
  "success": true
}
```

---

#### GET /auth/me
Get current user info (requires authentication).

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

### Directus API Proxy

#### ALL /api/*
Proxies all requests to Directus with automatic token injection from httpOnly cookie.

**Example:**
```bash
GET /api/items/posts
# Proxied to: https://directus-url/items/posts
# With Authorization: Bearer <token-from-cookie>
```

---

### Health Check

#### GET /health
Server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

## 🌐 Deployment Options

### Option 1: Node.js Server (VPS, Railway, Render, etc.)

1. **Build the project:**
```bash
npm run build
```

2. **Set environment variables** on your hosting platform

3. **Start the server:**
```bash
npm start
```

4. **Environment Variables Required:**
- `PORT`
- `NODE_ENV=production`
- `DIRECTUS_URL`
- `COOKIE_SECRET`
- `ALLOWED_ORIGINS`

---

### Option 2: Cloudflare Workers (Edge)

1. **Install Wrangler CLI:**
```bash
npm install -g wrangler
```

2. **Login to Cloudflare:**
```bash
wrangler login
```

3. **Update `wrangler.toml`:**
```toml
name = "my-react-app"
[vars]
DIRECTUS_URL = "https://your-directus-url.com"
ALLOWED_ORIGINS = "https://your-domain.com"
```

4. **Set secrets:**
```bash
wrangler secret put COOKIE_SECRET
```

5. **Deploy:**
```bash
npm run deploy:cloudflare
```

---

### Option 3: Vercel (Serverless)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Create `vercel.json` in server directory:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "DIRECTUS_URL": "https://your-directus-url.com",
    "NODE_ENV": "production"
  }
}
```

3. **Deploy:**
```bash
vercel
```

## 🔒 Security Features

### httpOnly Cookies
- Tokens stored in httpOnly cookies (not accessible to JavaScript)
- Protects against XSS attacks
- Automatic inclusion in requests

### CORS
- Configurable allowed origins
- Credentials support
- Preflight request handling

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` (production)
- `Strict-Transport-Security` (production)

### Cookie Settings
- `HttpOnly`: Prevents JavaScript access
- `Secure`: HTTPS only (production)
- `SameSite=Lax`: CSRF protection
- `Max-Age`: Configurable expiration

## 🧪 Testing

### Test Authentication Flow

1. **Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

2. **Get User Info:**
```bash
curl http://localhost:3000/auth/me \
  -b cookies.txt
```

3. **Logout:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## 📝 Development Notes

### Why Hono?

- **Platform Agnostic**: Same code works on Node.js and Edge
- **TypeScript First**: Native TypeScript support
- **Lightweight**: Small bundle size
- **Modern**: Built on Web Standards (Request/Response API)
- **Fast**: Excellent performance

### Cookie vs localStorage

| Feature | localStorage | httpOnly Cookie |
|---------|-------------|-----------------|
| XSS Protection | ❌ Vulnerable | ✅ Protected |
| CSRF Protection | ✅ Not vulnerable | ⚠️ Needs SameSite |
| JavaScript Access | ✅ Yes | ❌ No |
| Auto-send | ❌ Manual | ✅ Automatic |

### Migration from localStorage

The frontend has been updated to:
1. Remove `unstorage` dependency
2. Call `/auth/login` instead of `/api/auth/login`
3. Use `credentials: "include"` in all fetch requests
4. Remove manual token management

## 🐛 Troubleshooting

### Cookies not being set

- Check `ALLOWED_ORIGINS` includes your frontend URL
- Ensure `credentials: "include"` in frontend fetch calls
- Verify CORS headers in browser DevTools

### 401 Unauthorized errors

- Check if cookies are being sent (DevTools > Network > Cookies)
- Verify token hasn't expired
- Try refreshing token with `/auth/refresh`

### CORS errors

- Add frontend URL to `ALLOWED_ORIGINS`
- Check browser console for specific CORS error
- Verify preflight OPTIONS requests succeed

## 📚 Additional Resources

- [Hono Documentation](https://hono.dev/)
- [Directus API Reference](https://docs.directus.io/reference/introduction.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

