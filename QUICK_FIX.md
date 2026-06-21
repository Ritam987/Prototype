# 🚨 QUICK FIX - OAuth Localhost Redirect Issue

## The Problem
When clicking "Sign in with Google" on Vercel, it redirects to `localhost:3000` showing "localhost refused to connect".

## The Solution (5 Minutes)

### Step 1: Go to Vercel Dashboard
🔗 https://vercel.com/dashboard

### Step 2: Select Your Project
Click on your **Prototype** project

### Step 3: Go to Settings → Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** in left sidebar

### Step 4: Check OAUTH_REDIRECT_URL
Look for a variable named `OAUTH_REDIRECT_URL`

**IF YOU SEE IT:**
- Click the three dots (⋯) next to it
- Click **Delete**
- Confirm deletion

**IF YOU DON'T SEE IT:**
- Good! Leave it that way
- The app will auto-detect your Vercel URL

### Step 5: Verify These Variables Are Set
Make sure these exist (click "Add New" if missing):

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `SESSION_SECRET` | A secure random string (min 32 chars) |

### Step 6: Redeploy
1. Go to **Deployments** tab
2. Click three dots (⋯) on latest deployment
3. Click **Redeploy**
4. Click **Redeploy** button to confirm

### Step 7: Wait for Deployment
Wait 1-2 minutes for deployment to complete (green ✓)

### Step 8: Test
1. Open your Vercel URL in **incognito mode**
2. Click "Sign in with Google"
3. Should stay on your Vercel domain (NOT redirect to localhost)

---

## Still Not Working?

### Enable Debug Mode

1. In Vercel Environment Variables, add:
   - Name: `ENABLE_CONFIG_CHECK`
   - Value: `true`
2. Redeploy
3. Visit: `https://your-app.vercel.app/api/config-check`
4. Check the JSON output

**Look for:**
```json
{
  "oauthRedirectUrl": "https://your-app.vercel.app/auth/callback"  ✅ GOOD
}
```

**NOT:**
```json
{
  "oauthRedirectUrl": "http://localhost:3000/auth/callback"  ❌ BAD
}
```

If you see localhost in the output, the `OAUTH_REDIRECT_URL` variable is still set in Vercel. Delete it and redeploy again.

---

## Check Vercel Logs

```bash
vercel logs --follow
```

When you click "Sign in with Google", look for:

**✅ Good Log:**
```
🔍 OAuth Redirect Debug: {
  OAUTH_REDIRECT_URL_env: '(empty)',
  requestOrigin: 'https://your-app.vercel.app',
  isProduction: true
}
✅ Using dynamic OAuth redirect URL: https://your-app.vercel.app/auth/callback
```

**❌ Bad Log:**
```
🔍 OAuth Redirect Debug: {
  OAUTH_REDIRECT_URL_env: 'http://localhost:3000'
}
⚠️ SECURITY WARNING: localhost URL detected
```

---

## Need More Help?

See detailed troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Remember:** 
- ❌ Never set `OAUTH_REDIRECT_URL` to localhost in Vercel
- ✅ Leave `OAUTH_REDIRECT_URL` empty/unset in Vercel
- 🔄 Always redeploy after changing environment variables
- 🕵️ Always test in incognito mode
