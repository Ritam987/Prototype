# 🚀 Vercel Deployment Guide for CareerPath

## Critical: Fixing the OAuth Redirect Issue

### The Problem
If your Vercel deployment redirects to `localhost:3000` during Google Sign-In, it's because the OAuth redirect URL is misconfigured.

### The Solution

#### Step 1: Configure Vercel Environment Variables

Go to your Vercel project dashboard:
1. Navigate to: **Settings** → **Environment Variables**
2. Add/Update the following variables:

```env
# Required Variables
NODE_ENV=production
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# CRITICAL: Leave OAUTH_REDIRECT_URL empty or unset
# The app will auto-detect the production URL
# DO NOT set it to localhost!
```

**IMPORTANT:** 
- ❌ **DO NOT** set `OAUTH_REDIRECT_URL` in Vercel
- ❌ **DO NOT** set it to `http://localhost:3000`
- ✅ **LEAVE IT EMPTY** - The app will automatically detect your Vercel URL

If you must set it explicitly:
```env
OAUTH_REDIRECT_URL=https://your-project-name.vercel.app
```

#### Step 2: Configure Supabase OAuth Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Redirect URLs**:

```
https://your-project-name.vercel.app/auth/callback
https://your-project-name-*.vercel.app/auth/callback
```

**Note:** The wildcard `*` allows preview deployments to work

#### Step 3: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:

```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```

5. Add to **Authorized JavaScript origins**:

```
https://your-project-name.vercel.app
https://your-project-name-*.vercel.app
```

#### Step 4: Redeploy Your Application

After updating environment variables in Vercel:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Select **Redeploy**

**Option B: Via Git Push**
```bash
git add .
git commit -m "fix: Configure OAuth for production"
git push origin main
```

## Verification Checklist

After deployment, verify the following:

- [ ] Vercel environment variables are set correctly
- [ ] `OAUTH_REDIRECT_URL` is empty or set to your Vercel URL (NOT localhost)
- [ ] Supabase has your Vercel URL in redirect URLs
- [ ] Google Cloud Console has correct redirect URIs
- [ ] Application redirects to Google OAuth correctly
- [ ] After Google auth, it redirects back to your Vercel URL (not localhost)
- [ ] User can complete profile setup
- [ ] Dashboard loads correctly after authentication

## Debugging OAuth Issues

### Check Vercel Logs
```bash
vercel logs your-project-name --follow
```

Look for the log line:
```
🔐 OAuth Flow Started: {
  environment: 'production',
  redirectTo: 'https://your-project-name.vercel.app/auth/callback',
  origin: 'https://your-project-name.vercel.app'
}
```

### Common Issues

1. **Still redirecting to localhost:**
   - Check Vercel environment variables
   - Remove any `OAUTH_REDIRECT_URL` variable that contains localhost
   - Redeploy

2. **"redirect_uri_mismatch" error:**
   - Verify Supabase redirect URLs
   - Verify Google Cloud Console redirect URIs
   - Ensure URLs match exactly (including https://)

3. **Session not persisting:**
   - Verify `SESSION_SECRET` is set in Vercel
   - Check that cookies are enabled in browser
   - Ensure `NODE_ENV=production` is set

## Testing OAuth Flow

1. Open your Vercel deployment URL
2. Click "Sign in with Google"
3. Check the browser's address bar during redirect:
   - ✅ Should go to: `accounts.google.com`
   - ✅ Then back to: `your-project-name.vercel.app/auth/callback`
   - ❌ Should NOT go to: `localhost:3000`

## Auto-Detection How It Works

The application now automatically detects the production URL from the incoming request:

```javascript
// In server.js
function getRequestOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}
```

This means:
- ✅ **Development:** Uses `http://localhost:3000`
- ✅ **Production:** Uses your Vercel URL automatically
- ✅ **Preview Deployments:** Each preview gets its own URL

## Need Help?

If you're still experiencing issues:

1. Check Vercel function logs
2. Check Supabase auth logs
3. Verify all environment variables
4. Test in incognito mode to rule out cookie issues
5. Contact support with the exact error message and logs

---

**Last Updated:** 2026-06-21
