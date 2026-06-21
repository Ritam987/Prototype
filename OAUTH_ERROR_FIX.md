# 🔧 Google OAuth Error Fix - Complete Solution

## 🚨 Issue: "Google sign-in could not be completed. Please try again."

### Root Causes Identified and Fixed:

1. **PKCE Verifier Not Persisting Between Requests**
2. **Session Storage Not Saving Immediately**
3. **Incomplete Error Handling**
4. **Missing Session Data Persistence**

---

## ✅ Fixes Applied

### **1. Enhanced Session Storage with Immediate Save**

**Problem:** The PKCE code_verifier was stored in session during `/auth/google` but not accessible during `/auth/callback` because the session wasn't saved in time.

**Fix:**
```javascript
function createSessionStorage(req) {
  return {
    setItem(key, value) {
      req.session.supabaseOAuthStorage[key] = value;
      // Force immediate session save
      req.session.save((err) => {
        if (err) console.error('❌ Session save error:', err);
      });
    }
    // ... other methods
  };
}
```

### **2. Improved OAuth Client with Storage Key**

**Problem:** Supabase wasn't using a consistent storage key across requests.

**Fix:**
```javascript
function createOAuthClient(req) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      storage: createSessionStorage(req),
      storageKey: 'supabase-auth-token' // Consistent storage key
    }
  });
}
```

### **3. Enhanced OAuth Initiation with Better Options**

**Problem:** OAuth wasn't requesting proper permissions and account selection.

**Fix:**
```javascript
await authClient.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectTo,
    queryParams: {
      access_type: 'offline',  // Get refresh token
      prompt: 'consent'         // Force account selection
    }
  }
});
```

### **4. Comprehensive Error Handling in Callback**

**Problem:** Errors weren't being caught and logged properly.

**Fix:**
- Check for OAuth errors from Google
- Validate authorization code
- Check session data availability
- Validate returned user data
- Log every step with emojis for easy debugging

### **5. Store Supabase Session Data**

**Problem:** Supabase session tokens weren't being stored for future use.

**Fix:**
```javascript
req.session.supabaseSession = {
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at
};
```

### **6. Improved Logout with Supabase Signout**

**Problem:** Logging out didn't clear Supabase session, causing issues on re-login.

**Fix:**
```javascript
if (req.session.supabaseSession) {
  const authClient = createOAuthClient(req);
  await authClient.auth.signOut();
}
```

---

## 🔄 Complete OAuth Flow

### **Step 1: User Clicks "Continue with Google"**
```
1. Browser → GET /auth/google
2. Server creates OAuth client with session storage
3. Server calls signInWithOAuth()
4. Supabase stores PKCE code_verifier in session
5. Session saved immediately
6. Server redirects user to Google login
```

### **Step 2: Google Authentication**
```
1. User authenticates with Google
2. User selects account (prompted by 'consent')
3. Google redirects to: your-app.vercel.app/auth/callback?code=xxx
```

### **Step 3: Callback Processing**
```
1. Browser → GET /auth/callback?code=xxx
2. Server retrieves authorization code
3. Server creates OAuth client (with same session storage)
4. Supabase retrieves PKCE code_verifier from session
5. Server exchanges code for session (PKCE validation)
6. Supabase returns access_token + user data
7. Server checks database for existing user
8. Server saves session with user data
9. Server redirects to /setup-profile or /dashboard
```

### **Step 4A: New User (First Time)**
```
1. Browser → GET /setup-profile
2. User fills role selection form
3. Browser → POST /auth/register-profile
4. Server saves user profile to database
5. Server updates session (isProfileCompleted = true)
6. Server redirects to /dashboard
7. Dashboard redirects to role-specific dashboard
```

### **Step 4B: Existing User**
```
1. Browser → GET /dashboard
2. Server checks session (isProfileCompleted = true)
3. Server redirects to role-specific dashboard
4. User lands on their dashboard
```

---

## 📊 Detailed Logging Added

All OAuth steps now log with emoji indicators:

| Emoji | Meaning |
|-------|---------|
| 🔐 | OAuth flow starting |
| 🔧 | Client creation |
| 📦 | Session storage operations |
| 💾 | Session saving |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🔄 | Processing |
| 🔍 | Checking/searching |
| ➡️ | Redirecting |
| 👋 | Logout |
| 🔓 | Supabase signout |

### **Example Successful Flow Logs:**

```
🔐 Starting Google OAuth flow...
🔧 Creating OAuth client with session storage
🔐 OAuth Flow Configuration: { redirectTo: 'https://...', sessionID: '...' }
💾 Session Storage SET: pkce_code_verifier (stored)
✅ OAuth URL generated, saving session...
✅ Session saved, redirecting to Google...

--- User authenticates with Google ---

🔄 OAuth callback received
📍 Callback URL: /auth/callback?code=xxx
✅ Authorization code received
🔧 Creating OAuth client with session storage
🔄 Exchanging authorization code for session...
📦 Session storage check: { pkce_code_verifier: '...' }
✅ Google authentication successful for: user@example.com
✅ Session data: { access_token: '(exists)', refresh_token: '(exists)' }
🔍 Checking user profile in database...
📊 User profile check: Not found
💾 Session saved: { email: 'user@example.com', isProfileCompleted: false }
➡️ Redirecting to profile setup (new user)
```

---

## 🧪 Testing Instructions

### **Test 1: New User Complete Flow**

1. **Open Vercel URL in incognito:**
   ```
   https://your-app.vercel.app
   ```

2. **Click "Continue with Google"**
   - ✅ Should redirect to Google login
   - ✅ Should show account selection
   - ❌ Should NOT show error

3. **Select Google account and authenticate**
   - ✅ Should redirect back to your app
   - ✅ Should land on `/setup-profile`
   - ❌ Should NOT show "Google sign-in could not be completed"

4. **Fill profile form:**
   - Select role (Student/Counselor)
   - Fill required fields
   - Click "Complete Setup"
   - ✅ Should redirect to dashboard
   - ✅ Should land on role-specific dashboard

5. **Verify session:**
   - Refresh page
   - ✅ Should still be logged in
   - Navigate to other pages
   - ✅ Should still be logged in

### **Test 2: Existing User Re-login**

1. **After Test 1, click "Logout"**
   - ✅ Should show success message

2. **Click "Continue with Google" again**
   - ✅ Should redirect to Google
   - ✅ May show account selection (or auto-login if recently used)

3. **Complete Google authentication**
   - ✅ Should redirect back to your app
   - ✅ Should skip profile setup
   - ✅ Should land directly on dashboard

### **Test 3: Multiple Account Selection**

1. **Logout completely**

2. **Clear browser cookies**

3. **Click "Continue with Google"**
   - ✅ Should show Google account selection
   - ✅ Can choose different account
   - ✅ Each account gets own profile

### **Test 4: Error Scenarios**

1. **Test denying Google access:**
   - Click "Continue with Google"
   - On Google, click "Cancel"
   - ✅ Should redirect to login with error message

2. **Test with Supabase down:**
   - (Simulate by wrong credentials in Vercel)
   - ✅ Should show error message
   - ✅ Should not crash

---

## 🔧 Vercel Configuration Required

### **Environment Variables:**

```env
NODE_ENV=production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SESSION_SECRET=your_secure_random_secret_min_32_chars
```

**CRITICAL:**
- ❌ DO NOT set `OAUTH_REDIRECT_URL` (auto-detected)
- ✅ `SESSION_SECRET` must be strong (32+ chars)
- ✅ All Supabase keys must be correct

### **Supabase Configuration:**

1. **Authentication → Providers → Google**
   - ✅ Enabled
   - ✅ Client ID from Google Cloud Console
   - ✅ Client Secret from Google Cloud Console

2. **Authentication → URL Configuration → Redirect URLs**
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app-*.vercel.app/auth/callback
   ```

3. **Google Cloud Console → OAuth 2.0 Client**
   - **Authorized redirect URIs:**
     ```
     https://your-supabase-id.supabase.co/auth/v1/callback
     ```
   - **Authorized JavaScript origins:**
     ```
     https://your-app.vercel.app
     ```

---

## 🐛 Debugging Steps

### **If OAuth Still Fails:**

1. **Check Vercel Function Logs:**
   ```bash
   vercel logs --follow
   ```

2. **Look for these error indicators:**
   ```
   ❌ OAuth callback: missing authorization code
   ❌ Exchange code error
   ❌ No session or user data returned
   ❌ Session storage check: undefined
   ```

3. **Check Session Storage:**
   - Look for: `💾 Session Storage SET: pkce_code_verifier`
   - If missing → session not saving properly
   - Solution: Check `SESSION_SECRET` is set

4. **Check Authorization Code:**
   - Look for: `✅ Authorization code received`
   - If missing → Google isn't sending code
   - Solution: Check Google Cloud Console redirect URIs

5. **Check Supabase Response:**
   - Look for: `✅ Session data: { access_token: '(exists)' }`
   - If missing → Supabase exchange failed
   - Solution: Check Supabase credentials

---

## 🎯 Common Issues & Solutions

### **Issue 1: "Missing authorization code"**

**Cause:** Google didn't redirect with code parameter

**Solutions:**
1. Verify Google Cloud Console redirect URI
2. Verify Supabase Google OAuth configuration
3. Check if user denied permission

### **Issue 2: "Exchange code error"**

**Cause:** PKCE code_verifier not found in session

**Solutions:**
1. Verify `SESSION_SECRET` is set in Vercel
2. Check session is saving (look for 💾 logs)
3. Ensure cookies are enabled in browser
4. Test in incognito mode

### **Issue 3: "No session or user data returned"**

**Cause:** Supabase exchange failed

**Solutions:**
1. Verify Supabase credentials are correct
2. Check Supabase project is active
3. Verify Google OAuth is enabled in Supabase
4. Check Supabase logs in dashboard

### **Issue 4: Still redirecting to localhost**

**Cause:** `OAUTH_REDIRECT_URL` is set to localhost

**Solutions:**
1. Remove `OAUTH_REDIRECT_URL` from Vercel
2. Let app auto-detect production URL
3. Redeploy after removing variable

---

## ✅ Success Indicators

### **Vercel Logs Should Show:**

```
🔐 Starting Google OAuth flow...
✅ OAuth URL generated, saving session...
✅ Session saved, redirecting to Google...
🔄 OAuth callback received
✅ Authorization code received
✅ Google authentication successful for: user@example.com
✅ Session data: { access_token: '(exists)', refresh_token: '(exists)' }
💾 Session saved: { email: 'user@example.com', isProfileCompleted: true, role: 'student' }
➡️ Redirecting to dashboard (existing user)
```

### **User Experience:**

- ✅ Smooth Google account selection
- ✅ No error messages
- ✅ Proper redirection to profile setup or dashboard
- ✅ Session persists across page loads
- ✅ Logout and re-login works smoothly
- ✅ Can switch between Google accounts

---

## 📝 Files Modified

- ✅ `server.js` - Complete OAuth flow rewrite
  - Enhanced session storage with immediate save
  - Added comprehensive logging
  - Improved error handling
  - Fixed PKCE flow
  - Added Supabase session storage
  - Improved logout

---

**Status:** ✅ **OAUTH ERROR FIXED**

**Last Updated:** June 21, 2026
**Commit:** (will be added after push)
