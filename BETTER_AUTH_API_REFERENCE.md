# Better Auth API Reference

Complete API reference for your Better Auth backend at `http://localhost:3000/api/auth`

## Base URL
```
http://localhost:3000/api/auth
```

## Authentication
- **Cookie**: `apiKeyCookie` - Session token stored in httpOnly cookie
- **Bearer Token**: `Authorization: Bearer <token>` header

---

## 📝 Available Endpoints

### 1. Sign Up with Email
**`POST /sign-up/email`**

Create a new user account with email and password.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "image": "string (optional)",
  "callbackURL": "string (optional)",
  "rememberMe": "boolean (optional, default: true)"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string | null",
    "emailVerified": false,
    "createdAt": "date-time",
    "updatedAt": "date-time"
  }
}
```

**Errors:**
- `400` - Bad Request (missing parameters)
- `422` - User already exists
- `500` - Internal Server Error

---

### 2. Sign In with Email
**`POST /sign-in/email`**

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "callbackURL": "string (optional)",
  "rememberMe": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "redirect": false,
  "token": "string",
  "url": null,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string | null",
    "emailVerified": boolean,
    "createdAt": "date-time",
    "updatedAt": "date-time"
  }
}
```

**Errors:**
- `400` - Bad Request
- `401` - Invalid credentials
- `500` - Internal Server Error

---

### 3. Sign In with Social Provider
**`POST /sign-in/social`**

Authenticate with OAuth providers (Google, GitHub, etc.).

**Request Body:**
```json
{
  "provider": "string (required)",
  "callbackURL": "string (optional)",
  "newUserCallbackURL": "string (optional)",
  "errorCallbackURL": "string (optional)",
  "disableRedirect": "boolean (optional)",
  "scopes": "array (optional)",
  "requestSignUp": "boolean (optional)",
  "loginHint": "string (optional)",
  "idToken": {
    "token": "string (required)",
    "nonce": "string (optional)",
    "accessToken": "string (optional)",
    "refreshToken": "string (optional)",
    "expiresAt": "number (optional)"
  }
}
```

---

### 4. Get Session
**`GET /get-session`**

Get the current authenticated user's session.

**Response (200):**
```json
{
  "session": {
    "id": "string",
    "expiresAt": "string",
    "token": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "ipAddress": "string",
    "userAgent": "string",
    "userId": "string"
  },
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": boolean,
    "image": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Errors:**
- `401` - Not authenticated

---

### 5. Sign Out
**`POST /sign-out`**

Sign out the current user and clear session.

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### 6. Forget Password
**`POST /forget-password`**

Send a password reset email to the user.

**Request Body:**
```json
{
  "email": "string (required)",
  "redirectTo": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true,
  "message": "string"
}
```

**Notes:**
- If token is invalid: redirects to `?error=INVALID_TOKEN`
- If token is valid: redirects to `?token=VALID_TOKEN`

---

### 7. Reset Password
**`POST /reset-password`**

Reset the password using a reset token.

**Request Body:**
```json
{
  "newPassword": "string (required)",
  "token": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true
}
```

---

### 8. Change Password
**`POST /change-password`**

Change the password for authenticated user.

**Request Body:**
```json
{
  "newPassword": "string (required)",
  "currentPassword": "string (required)",
  "revokeOtherSessions": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "token": "string | null",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string | null",
    "emailVerified": boolean,
    "createdAt": "date-time",
    "updatedAt": "date-time"
  }
}
```

**Notes:**
- If `revokeOtherSessions` is true, a new token is returned
- Requires authentication

---

### 9. Verify Email
**`GET /verify-email`**

Verify user's email address using a token.

**Query Parameters:**
- `token` (required): Verification token
- `callbackURL` (optional): URL to redirect after verification

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "image": "string",
    "emailVerified": true,
    "createdAt": "string",
    "updatedAt": "string"
  },
  "status": true
}
```

---

### 10. Send Verification Email
**`POST /send-verification-email`**

Send a verification email to the user.

**Request Body:**
```json
{
  "email": "string (required)",
  "callbackURL": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true
}
```

**Errors:**
- `400` - Verification email isn't enabled

---

### 11. Change Email
**`POST /change-email`**

Change the email address for authenticated user.

**Request Body:**
```json
{
  "newEmail": "string (required)",
  "callbackURL": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true,
  "message": "Email updated" | "Verification email sent"
}
```

**Errors:**
- `401` - Not authenticated
- `422` - Email already exists

---

### 12. Update User
**`POST /update-user`**

Update the current user's profile.

**Request Body:**
```json
{
  "name": "string (optional)",
  "image": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true
}
```

**Errors:**
- `401` - Not authenticated

---

### 13. Delete User
**`POST /delete-user`**

Delete the current user's account.

**Request Body:**
```json
{
  "password": "string (required)",
  "callbackURL": "string (optional)"
}
```

**Response (200):**
```json
{
  "status": true
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid password

---

### 14. List Sessions
**`GET /list-sessions`**

Get all active sessions for the current user.

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "string",
      "expiresAt": "string",
      "token": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "ipAddress": "string",
      "userAgent": "string",
      "userId": "string"
    }
  ]
}
```

---

### 15. Revoke Session
**`POST /revoke-session`**

Revoke a specific session.

**Request Body:**
```json
{
  "token": "string (required)"
}
```

**Response (200):**
```json
{
  "status": true
}
```

---

### 16. Revoke Other Sessions
**`POST /revoke-other-sessions`**

Revoke all sessions except the current one.

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "status": true
}
```

---

### 17. Revoke Sessions
**`POST /revoke-sessions`**

Revoke all sessions for the current user.

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "status": true
}
```

---

## 📋 Data Schemas

### User Object
```typescript
{
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Object
```typescript
{
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}
```

### Account Object
```typescript
{
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔒 Common Error Responses

### 400 - Bad Request
```json
{
  "message": "string"
}
```

### 401 - Unauthorized
```json
{
  "message": "string"
}
```

### 403 - Forbidden
```json
{
  "message": "string"
}
```

### 404 - Not Found
```json
{
  "message": "string"
}
```

### 422 - Unprocessable Entity
```json
{
  "message": "string"
}
```

### 429 - Too Many Requests
```json
{
  "message": "string"
}
```

### 500 - Internal Server Error
```json
{
  "message": "string"
}
```

---

## 🚀 Usage Examples with Axios

### Sign Up
```typescript
const result = await axios.post('/api/auth/sign-up/email', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123'
}, {
  withCredentials: true
});
```

### Sign In
```typescript
const result = await axios.post('/api/auth/sign-in/email', {
  email: 'john@example.com',
  password: 'SecurePass123'
}, {
  withCredentials: true
});
```

### Get Session
```typescript
const result = await axios.get('/api/auth/get-session', {
  withCredentials: true
});
```

### Sign Out
```typescript
await axios.post('/api/auth/sign-out', {}, {
  withCredentials: true
});
```

---

## 📚 Additional Resources

- **View OpenAPI Spec**: http://localhost:3000/api/auth/reference
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Auth Service**: `src/services/auth.service.ts`
- **Security Guide**: `AXIOS_AUTH_SECURITY.md`

---

**Note**: All endpoints that require authentication will use the session cookie automatically when `withCredentials: true` is set in axios.
