# 🔍 OAuth Debug Guide - "Google sign-in could not be completed"

## 🚨 If You're Seeing This Error

The error "Google sign-in could not be completed. Please try again." means the OAuth flow is failing. Let's diagnose and fix it step by step.

---

## 📊 Step 1: Check Vercel Logs (MOST IMPORTANT)

### **How to Check Logs:**

**Option A: Using Vercel CLI**
```bash
vercel logs --follow
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click "Logs" tab
4. Select latest deployment
5. Click "View Function Logs"

### **What to Look For:**

#### **Scenario 1: Supabase Credentials Missing**
```
❌ Supabase credentials missing
```
**Solution:** Supabase environment variables not set in Vercel

#### **Scenario 2: OAuth Client Creation Fails**
```
❌ OAuth error: Invalid API key
❌ OAuth error: Project not found
```
**Solution:** Supabase credentials are wrong

#### **Scenario 3: Missing Authorization Code**
```
❌ OAuth callback: missing authorization code
📍 Full query: { error: 'access_denied' }
```
**Solution:** User denied permission OR Google redirect URI is wrong

#### **Scenario 4: PKCE Validation Failed**
```
❌ Exchange code error: { message: 'Invalid code verifier' }
📦 Session storage check: undefined
```
**Solution:** Session not saving properly (SESSION_SECRET issue)

#### **Scenario 5: No Session Storage**
```
📦 Session Storage GET: pkce_code_verifier (null)
```
**Solution:** Session lost between requests

---

## 🔧 Step 2: Verify Vercel Environment Variables

### **Go to Vercel Dashboard:**
1. Your Project → Settings → Environment Variables

### **Required Variables:**

| Variable | Status | Value Format | Where to Get It |
|----------|--------|--------------|-----------------|
| `NODE_ENV` | ✅ Required | `production` | Literal value |
| `SUPABASE_URL` | ✅ Required | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | ✅ Required | `eyJhbGc...` (long string) | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | `eyJhbGc...` (long string) | Supabase Dashboard → Settings → API → service_role |
| `SESSION_SECRET` | ✅ Required | Random 32+ chars | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OAUTH_REDIRECT_URL` | ❌ Should NOT be set | - | Leave empty/unset |

### **How to Get Supabase Keys:**

1. Go to https://app.supabase.com/
2. Select your project
3. Click **Settings** (gear icon in left sidebar)
4. Click **API**
5. Copy these values:
   - **URL** → `SUPABASE_URL`
   - **anon public** (under Project API keys) → `SUPABASE_ANON_KEY`
   - **service_role** (under Project API keys) → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ IMPORTANT:** The keys should start with `eyJhbGc...` and be very long (200+ characters)

### **Common Mistakes:**

❌ **Using placeholder keys like:**
```
SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
```

✅ **Real keys look like:**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

---

## 🧪 Step 3: Use Diagnostic Endpoints

### **Enable Diagnostic Mode in Vercel:**

1. Add environment variable:
   ```
   ENABLE_CONFIG_CHECK=true
   ```
2. Redeploy
3. Wait for deployment to complete

### **Test 1: Check Configuration**

Visit: `https://your-app.vercel.app/api/config-check`

**Expected Response:**
```json
{
  "environment": "production",
  "oauthRedirectUrl": "https://your-app.vercel.app/auth/callback",
  "envVars": {
    "OAUTH_REDIRECT_URL": "(empty)",
    "SUPABASE_URL": "(set)",
    "SUPABASE_ANON_KEY": "(set - eyJhbGc...)",
    "SESSION_SECRET": "(set)"
  },
  "supabaseCheck": {
    "clientInitialized": true,
    "urlValid": true,
    "anonKeyValid": true
  }
}
```

**❌ If you see:**
```json
{
  "supabaseCheck": {
    "clientInitialized": false,
    "urlValid": false,
    "anonKeyValid": false
  }
}
```
**→ Your Supabase credentials are wrong!**

### **Test 2: Test OAuth Flow**

Visit: `https://your-app.vercel.app/api/test-oauth`

**Expected Response:**
```json
{
  "success": true,
  "hasUrl": true,
  "urlPreview": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**❌ If you see:**
```json
{
  "success": false,
  "error": "Supabase signInWithOAuth error",
  "details": {
    "message": "Invalid API key",
    "status": 401
  }
}
```
**→ Your Supabase ANON_KEY is wrong!**

---

## 🔧 Step 4: Verify Supabase Configuration

### **Check Google OAuth Provider:**

1. Go to https://app.supabase.com/
2. Select your project
3. Click **Authentication** in left sidebar
4. Click **Providers**
5. Find **Google** provider
6. Verify:
   - ✅ **Enabled** toggle is ON
   - ✅ **Client ID** is filled
   - ✅ **Client Secret** is filled

### **Check Redirect URLs:**

1. Still in Authentication section
2. Click **URL Configuration**
3. Verify **Redirect URLs** includes:
   ```
   https://your-app-name.vercel.app/auth/callback
   https://your-app-name-*.vercel.app/auth/callback
   ```

### **Common Issue: Wrong Project**

If you have multiple Supabase projects:
- Make sure you're looking at the CORRECT project
- The project URL should match your `SUPABASE_URL` in Vercel

---

## 🔧 Step 5: Verify Google Cloud Console

### **Check OAuth 2.0 Client:**

1. Go to https://console.cloud.google.com/
2. Select your project
3. Click **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Verify **Authorized redirect URIs** includes:
   ```
   https://YOUR_SUPABASE_ID.supabase.co/auth/v1/callback
   ```

**⚠️ CRITICAL:** The redirect URI should be your **Supabase URL**, not your Vercel URL!

**Example:**
```
✅ CORRECT: https://xpgmbqwokgcbswrvygri.supabase.co/auth/v1/callback
❌ WRONG: https://your-app.vercel.app/auth/callback
```

---

## 🔄 Step 6: Complete Fix Procedure

If none of the above worked, follow this complete procedure:

### **1. Get Fresh Supabase Keys:**

```bash
# Visit Supabase dashboard
https://app.supabase.com/project/YOUR_PROJECT/settings/api

# Copy:
# 1. URL (e.g., https://xxxxx.supabase.co)
# 2. anon public key (starts with eyJhbGc...)
# 3. service_role key (starts with eyJhbGc...)
```

### **2. Update Vercel Environment Variables:**

```bash
# In Vercel dashboard, set:
NODE_ENV=production
SUPABASE_URL=<paste exact URL from Supabase>
SUPABASE_ANON_KEY=<paste exact anon key from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<paste exact service_role key from Supabase>
SESSION_SECRET=<generate new 64-character random string>

# Generate SESSION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# DO NOT SET:
OAUTH_REDIRECT_URL (leave it unset/empty)
```

### **3. Verify Google OAuth in Supabase:**

```bash
# 1. Supabase → Authentication → Providers → Google
#    - Enable: ON
#    - Client ID: (from Google Cloud Console)
#    - Client Secret: (from Google Cloud Console)

# 2. Supabase → Authentication → URL Configuration
#    Add redirect URLs:
#    - https://your-app.vercel.app/auth/callback
#    - https://your-app-*.vercel.app/auth/callback
```

### **4. Verify Google Cloud Console:**

```bash
# Google Cloud Console → Credentials → OAuth 2.0 Client
# Authorized redirect URIs should include:
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```

### **5. Redeploy:**

```bash
# Option A: Force redeploy from Vercel dashboard
# 1. Go to Deployments tab
# 2. Click "..." on latest deployment
# 3. Click "Redeploy"

# Option B: Push empty commit
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### **6. Wait and Test:**

```bash
# 1. Wait 2 minutes for deployment
# 2. Clear browser cache/cookies
# 3. Test in incognito mode
# 4. Visit: https://your-app.vercel.app
# 5. Click "Continue with Google"
```

---

## 🐛 Step 7: Check Specific Error Scenarios

### **Error: "Invalid API key"**

**Cause:** `SUPABASE_ANON_KEY` is wrong

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy **anon public** key (the long one under "Project API keys")
3. Paste EXACTLY into Vercel's `SUPABASE_ANON_KEY`
4. Redeploy

### **Error: "Project not found"**

**Cause:** `SUPABASE_URL` is wrong

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy **URL** (should be like https://xxxxx.supabase.co)
3. Paste EXACTLY into Vercel's `SUPABASE_URL`
4. Redeploy

### **Error: "Invalid code verifier" or "PKCE validation failed"**

**Cause:** Session not persisting between requests

**Fix:**
1. Verify `SESSION_SECRET` is set in Vercel
2. Generate a NEW strong secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Set it in Vercel as `SESSION_SECRET`
4. Redeploy

### **Error: "Missing authorization code"**

**Cause:** Google isn't redirecting back with auth code

**Fix:**
1. Check Google Cloud Console redirect URIs
2. Should be: `https://YOUR_SUPABASE_ID.supabase.co/auth/v1/callback`
3. NOT your Vercel URL
4. Save and wait a few minutes for Google to update

---

## ✅ Success Checklist

After making changes, verify:

- [ ] All environment variables set in Vercel
- [ ] `SUPABASE_ANON_KEY` starts with `eyJhbGc`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` starts with `eyJhbGc`
- [ ] `SESSION_SECRET` is 32+ characters
- [ ] `OAUTH_REDIRECT_URL` is NOT set
- [ ] Redeployed after changing variables
- [ ] Google OAuth enabled in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Google Cloud Console redirect URI is Supabase URL
- [ ] Tested in incognito mode

---

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

### **Collect This Information:**

1. **Vercel Logs** (last 50 lines):
   ```bash
   vercel logs | tail -50
   ```

2. **Config Check Response**:
   ```
   Visit: https://your-app.vercel.app/api/config-check
   Copy the JSON response
   ```

3. **Test OAuth Response**:
   ```
   Visit: https://your-app.vercel.app/api/test-oauth
   Copy the JSON response
   ```

4. **Screenshot Vercel Environment Variables**
   - Blur out the actual keys
   - Show which variables are set

5. **Describe What Happens**:
   - Click "Continue with Google"
   - What do you see?
   - Do you get redirected to Google?
   - Do you come back with an error?

---

## 🎯 Quick Fixes Summary

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Wrong `SUPABASE_ANON_KEY` → Get fresh from Supabase |
| "Project not found" | Wrong `SUPABASE_URL` → Get fresh from Supabase |
| "Invalid code verifier" | Session issue → Set strong `SESSION_SECRET` |
| "Missing authorization code" | Wrong Google redirect URI → Use Supabase URL |
| Still redirecting to localhost | `OAUTH_REDIRECT_URL` is set → Remove it |
| No error logs | Variables not set → Add all required env vars |

---

**Remember:** After EVERY change to environment variables, you MUST redeploy! ✅

**Last Updated:** June 21, 2026
