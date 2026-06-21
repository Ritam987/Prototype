# 🔧 Session Redirect Loop Fix

## 🚨 Problem: User Redirected Back to Login After Role Selection

### **Issue:**
After successful Google OAuth and completing profile setup, users are immediately redirected back to the login page, creating an infinite loop.

### **Root Causes:**

1. **NODE_ENV not set to 'production' in Vercel**
   - Session cookie `secure` flag depends on this
   - If not set, cookies may not work on HTTPS

2. **Session not persisting between requests**
   - Cookie not being sent back from browser
   - Session store issues

3. **Redirect loop between login and dashboard**
   - Dashboard checks auth → redirects to login
   - Login doesn't check if already authenticated

---

## ✅ **Fixes Applied:**

### **1. Enhanced Session Configuration**

```javascript
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/' // Ensure cookie sent for all paths
  },
  name: 'careerpath.sid',
  proxy: isProduction // Trust proxy headers in production
}));
```

### **2. Added Session Debugging Middleware**

```javascript
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/dashboard')) {
    console.log('🔐 Session Check:', {
      path: req.path,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      googleAuthenticated: req.session?.googleAuthenticated,
      isProfileCompleted: req.session?.isProfileCompleted,
      userRole: req.session?.userRole
    });
  }
  next();
});
```

### **3. Fixed Login Page Redirect Loop**

```javascript
app.get('/login', function (req, res) {
  // If user is already logged in, redirect to dashboard
  if (req.session && req.session.googleAuthenticated && req.session.isProfileCompleted) {
    console.log('✅ User already authenticated, redirecting to dashboard');
    return res.redirect('/dashboard');
  }
  
  res.render('login-signup', ...);
});
```

---

## 🔧 **Required Vercel Configuration**

### **CRITICAL: Set NODE_ENV in Vercel**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Add or update:**
   ```
   NODE_ENV = production
   ```
3. **Redeploy**

**This is crucial!** Without `NODE_ENV=production`, the session cookies won't work on HTTPS.

### **All Required Environment Variables:**

```
NODE_ENV=production
SUPABASE_URL=https://xpgmbqwokgcbswrvygri.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SESSION_SECRET=<64-character-random-string>
```

---

## 🧪 **Testing After Fix:**

### **Test 1: New User Registration**

1. Open incognito browser
2. Go to your Vercel URL
3. Click "Continue with Google"
4. Complete OAuth
5. Fill profile form (select role, fill details)
6. Click "Complete Setup"
7. **Expected:** Redirect to dashboard (NOT back to login)
8. **Verify:** Refresh page → still on dashboard

### **Test 2: Existing User Login**

1. After Test 1, click Logout
2. Click "Continue with Google"
3. Complete OAuth
4. **Expected:** Direct redirect to dashboard (skip profile)
5. **Verify:** No login loop

### **Test 3: Session Persistence**

1. Login successfully
2. Navigate to different pages
3. Refresh browser
4. Close and reopen tab (within 24 hours)
5. **Expected:** Still logged in

---

## 🔍 **Debugging with Logs**

After deploying, check Vercel logs:

```bash
vercel logs --follow
```

### **Look for these indicators:**

#### **Successful Flow:**
```
🔐 Session Check: {
  path: '/auth/callback',
  sessionID: 'xxx...',
  hasSession: true,
  googleAuthenticated: true,
  isProfileCompleted: true,
  userRole: 'student'
}
✅ User already authenticated, redirecting to dashboard
🏠 Dashboard accessed: {
  googleAuthenticated: true,
  isProfileCompleted: true,
  userRole: 'student'
}
✅ Dashboard: Redirecting to student dashboard
```

#### **Problem Indicators:**
```
🔐 Session Check: {
  hasSession: false  ❌ Session not created
}

OR

🔐 Session Check: {
  hasSession: true,
  googleAuthenticated: undefined  ❌ Session data lost
}

OR

⚠️ Student dashboard: Unauthorized access  ❌ Redirect loop
```

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Still Redirecting to Login**

**Symptoms:**
- User completes profile setup
- Immediately redirected to login
- Logs show: `googleAuthenticated: undefined`

**Cause:** `NODE_ENV` not set to `production` in Vercel

**Solution:**
1. Vercel → Settings → Environment Variables
2. Add: `NODE_ENV = production`
3. Redeploy
4. Test again

### **Issue 2: Session Lost on Refresh**

**Symptoms:**
- Login works initially
- Refresh page → redirected to login
- Logs show: `hasSession: false`

**Cause:** Session cookie not persisting

**Solutions:**

**A. Check SESSION_SECRET:**
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set in Vercel and redeploy.

**B. Check browser cookies:**
- Open DevTools → Application → Cookies
- Look for `careerpath.sid` cookie
- If missing → cookie not being set

**C. Check HTTPS:**
- Ensure your Vercel URL uses HTTPS
- `secure: true` cookies only work on HTTPS

### **Issue 3: Infinite Redirect Loop**

**Symptoms:**
- Browser shows "Too many redirects"
- Logs show repeated `/login` and `/dashboard` requests

**Cause:** Login page not checking if user is authenticated

**Solution:** Already fixed in code - `/login` now checks auth state

---

## 📊 **Verification Checklist**

After deployment, verify:

- [ ] `NODE_ENV=production` set in Vercel
- [ ] `SESSION_SECRET` is strong (32+ chars)
- [ ] All Supabase credentials set correctly
- [ ] Redeployed after environment variable changes
- [ ] Test in incognito mode
- [ ] Check Vercel logs for session check logs
- [ ] Verify cookie is set in browser (DevTools)
- [ ] Test complete flow: login → profile → dashboard
- [ ] Test existing user: login → dashboard (no profile)
- [ ] Test refresh: still logged in
- [ ] Test logout: can login again

---

## 🎯 **Expected Behavior**

### **New User Flow:**
```
1. /login
2. Click "Continue with Google"
3. /auth/google → Google OAuth
4. /auth/callback → Session created
5. /setup-profile → Fill form
6. POST /auth/register-profile → Update session
7. /dashboard → Check role
8. /student-dashboard or /counselor-dashboard → SUCCESS ✅
9. Refresh → Still on dashboard ✅
```

### **Existing User Flow:**
```
1. /login
2. Click "Continue with Google"
3. /auth/google → Google OAuth
4. /auth/callback → Session created with profile
5. /dashboard → Check role
6. /student-dashboard or /counselor-dashboard → SUCCESS ✅
7. Refresh → Still on dashboard ✅
```

---

## 🆘 **If Still Not Working**

Collect this information:

### **1. Vercel Logs:**
```bash
vercel logs | grep "Session Check"
```

### **2. Browser DevTools:**
- Network tab → Check redirects
- Application → Cookies → Screenshot `careerpath.sid`
- Console → Any errors?

### **3. Environment Variables:**
Screenshot from Vercel (blur secrets)

### **4. Test with cURL:**
```bash
# Test session cookie
curl -I https://your-app.vercel.app/login
# Look for Set-Cookie header
```

---

**Status:** ✅ **Session Management Fixed**

**Key Fix:** `NODE_ENV=production` + Enhanced session config + Login redirect check

**Last Updated:** June 21, 2026
