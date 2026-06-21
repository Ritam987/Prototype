# 🔧 Troubleshooting OAuth Redirect Issues

## Issue: Vercel redirects to localhost:3000 during Google Sign-In

### Root Cause Analysis

When you click "Sign in with Google" on Vercel and it redirects to `localhost:3000`, the issue is **100% caused by incorrect Vercel environment variables**, specifically the `OAUTH_REDIRECT_URL` variable.

---

## ✅ IMMEDIATE FIX - Step by Step

### Step 1: Check Your Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **Prototype**
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Look for `OAUTH_REDIRECT_URL`

### Step 2: Remove or Fix OAUTH_REDIRECT_URL

**Option A: Remove it completely (RECOMMENDED)**
- If you see `OAUTH_REDIRECT_URL` in the list:
  - Click the three dots (⋯) next to it
  - Click **Delete**
  - Confirm deletion

**Option B: Set it to your Vercel URL**
- If you prefer to set it explicitly:
  - Value: `https://your-project-name.vercel.app`
  - **NOT**: `http://localhost:3000`

### Step 3: Verify Other Environment Variables

Ensure these are set correctly in Vercel:

```
NODE_ENV=production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_secure_session_secret
```

**CRITICAL:** Do NOT set `OAUTH_REDIRECT_URL` at all. Leave it unset/empty.

### Step 4: Redeploy Your Application

After changing environment variables, you MUST redeploy:

**Method A: Trigger from Vercel Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (⋯)
4. Click **Redeploy**
5. Check "Use existing Build Cache" (optional)
6. Click **Redeploy**

**Method B: Push to GitHub**
```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Step 5: Test the Fix

1. Clear browser cache and cookies
2. Open your Vercel URL in **incognito/private mode**
3. Click "Sign in with Google"
4. Verify the URL stays on your Vercel domain

---

## 🔍 Diagnostic Tools

### Check Configuration Endpoint

I've added a diagnostic endpoint to help you debug. 

**In Development:**
Visit: `http://localhost:3000/api/config-check`

**In Production (requires enabling):**
1. Add environment variable in Vercel: `ENABLE_CONFIG_CHECK=true`
2. Redeploy
3. Visit: `https://your-app.vercel.app/api/config-check`
4. Check the JSON output

**What to look for:**
```json
{
  "environment": "production",
  "isProduction": true,
  "requestOrigin": "https://your-app.vercel.app",
  "oauthRedirectUrl": "https://your-app.vercel.app/auth/callback",
  "headers": {
    "x-forwarded-proto": "https",
    "x-forwarded-host": "your-app.vercel.app",
    "host": "your-app.vercel.app"
  },
  "envVars": {
    "OAUTH_REDIRECT_URL": "(empty)",
    "SUPABASE_URL": "(set)",
    "PORT": "3000"
  }
}
```

**🚨 Red Flags:**
- `oauthRedirectUrl` contains "localhost"
- `OAUTH_REDIRECT_URL` shows "(set)" instead of "(empty)"
- `x-forwarded-host` is missing or wrong

### Check Vercel Function Logs

```bash
vercel logs your-project-name --follow
```

Look for these log lines when clicking "Sign in with Google":

**Good Output:**
```
🔍 OAuth Redirect Debug: {
  OAUTH_REDIRECT_URL_env: '(empty)',
  requestOrigin: 'https://your-app.vercel.app',
  isProduction: true,
  ...
}
✅ Using dynamic OAuth redirect URL: https://your-app.vercel.app/auth/callback
```

**Bad Output (indicates problem):**
```
🔍 OAuth Redirect Debug: {
  OAUTH_REDIRECT_URL_env: 'http://localhost:3000',
  ...
}
⚠️ SECURITY WARNING: localhost URL detected in production environment
```

---

## 🎯 Common Mistakes

### Mistake #1: Environment Variable Still Set
**Problem:** `OAUTH_REDIRECT_URL` is set to `http://localhost:3000` in Vercel
**Solution:** Delete it from Vercel environment variables

### Mistake #2: Not Redeploying After Changes
**Problem:** Changed environment variables but didn't redeploy
**Solution:** Always redeploy after changing environment variables

### Mistake #3: Wrong Supabase Configuration
**Problem:** Supabase doesn't have your Vercel URL in redirect URLs
**Solution:** 
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add: `https://your-project-name.vercel.app/auth/callback`
3. Add wildcard for previews: `https://your-project-name-*.vercel.app/auth/callback`

### Mistake #4: Browser Cache
**Problem:** Browser is caching old OAuth flow
**Solution:** Test in incognito mode or clear all site data

### Mistake #5: Wrong Google Cloud Configuration
**Problem:** Google OAuth redirect URI not configured
**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Add to Authorized redirect URIs: `https://YOUR_SUPABASE_ID.supabase.co/auth/v1/callback`

---

## 📊 Environment Variable Comparison

| Variable | Local (.env) | Vercel Production |
|----------|--------------|-------------------|
| `NODE_ENV` | `development` | `production` |
| `OAUTH_REDIRECT_URL` | Empty or localhost | **MUST BE EMPTY** |
| `SUPABASE_URL` | Your project URL | Same project URL |
| `SUPABASE_ANON_KEY` | Your anon key | Same anon key |
| `SESSION_SECRET` | Dev secret | Strong production secret |

---

## 🔄 Complete Reset Procedure

If nothing works, follow this complete reset:

### 1. Clean Vercel Environment Variables
```bash
# Remove all environment variables related to OAuth
# Then add them back one by one from the list above
```

### 2. Clear Local Git Cache
```bash
git rm -r --cached .
git add .
git commit -m "Clear cache"
git push origin main
```

### 3. Force Redeploy
```bash
# From Vercel dashboard, delete the latest deployment
# Then trigger a new deployment
```

### 4. Test with Fresh Browser
- Use incognito mode
- Or use a different browser
- Clear all cookies for your domain

---

## 🆘 Still Not Working?

### Check These Files

**1. server.js - Line 79-118**
The `getOAuthRedirectUrl()` function should have:
- Dynamic request origin detection
- Production localhost blocking
- Detailed debug logging

**2. Vercel Dashboard - Environment Variables**
Screenshot your environment variables and verify:
- No `OAUTH_REDIRECT_URL` is set, OR
- `OAUTH_REDIRECT_URL` is set to your actual Vercel URL (NOT localhost)

**3. Supabase Dashboard - Authentication - URL Configuration**
Verify redirect URLs include:
- `https://your-project-name.vercel.app/auth/callback`
- `https://your-project-name-*.vercel.app/auth/callback`

### Enable Debug Mode

Add to Vercel environment variables:
```
ENABLE_CONFIG_CHECK=true
```

Then visit: `https://your-app.vercel.app/api/config-check`

Send me the JSON output for further diagnosis.

---

## ✅ Success Indicators

You'll know it's fixed when:

1. ✅ Clicking "Sign in with Google" redirects to `accounts.google.com`
2. ✅ After Google login, you're redirected to `your-app.vercel.app/auth/callback`
3. ✅ No "localhost refused to connect" error
4. ✅ Profile setup page loads correctly
5. ✅ You can complete registration and access dashboard

---

## 📝 Prevention Checklist

- [ ] Never commit `.env` file to Git
- [ ] Never set `OAUTH_REDIRECT_URL` to localhost in production
- [ ] Always test OAuth in incognito mode after deployment
- [ ] Keep Supabase redirect URLs updated when domain changes
- [ ] Use Vercel preview deployments for testing before production

---

**Last Updated:** June 21, 2026
**Deployment Guide:** See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
