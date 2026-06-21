# 🚀 Deployment Checklist - Authentication Fix

## ✅ Pre-Deployment (Done)

- [x] Fixed session handling with named cookie
- [x] Added comprehensive logging
- [x] Improved error handling
- [x] Fixed logout functionality
- [x] Enhanced route protection
- [x] Committed and pushed to GitHub

---

## 🔧 Vercel Configuration (You Need to Do This)

### Step 1: Verify Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required Variables:**
```
NODE_ENV=production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SESSION_SECRET=your_secure_random_secret_minimum_32_characters
```

**CRITICAL:**
- ❌ DO NOT set `OAUTH_REDIRECT_URL` (let it auto-detect)
- ✅ `SESSION_SECRET` must be at least 32 characters
- ✅ All Supabase keys must be correct

### Step 2: Generate a Secure SESSION_SECRET

If you don't have a secure session secret:

**Option A: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using Online Generator**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)

### Step 3: Wait for Auto-Deploy

Vercel will automatically deploy after you pushed to GitHub.

**Check Deployment:**
1. Go to **Deployments** tab
2. Wait for green checkmark ✅
3. Should take 1-2 minutes

---

## 🧪 Testing After Deployment

### Test 1: New User Registration

1. Open your Vercel URL in **incognito mode**: `https://your-app.vercel.app`
2. Click "Continue with Google"
3. **Expected:** Redirected to Google login
4. Sign in with Google
5. **Expected:** Redirected to `/setup-profile`
6. Select "Student" role
7. Fill in name
8. Click "Complete Setup & Continue"
9. **Expected:** Redirected to student dashboard
10. **Expected:** No redirect loop!

### Test 2: Existing User Login

1. After completing Test 1, click "Logout"
2. **Expected:** See logout success message
3. Click "Continue with Google" again
4. **Expected:** Redirected directly to dashboard (skip profile setup)
5. **Expected:** Lands on student dashboard

### Test 3: Session Persistence

1. While logged in, refresh the page
2. **Expected:** Still logged in
3. Navigate to different pages (About, Contact, etc.)
4. Navigate back to Dashboard
5. **Expected:** Still logged in, no redirect to login

### Test 4: Protected Routes

1. Open a new incognito window
2. Try to access: `https://your-app.vercel.app/student-dashboard`
3. **Expected:** Redirected to `/login?error=auth_required`
4. **Expected:** See warning message

### Test 5: Role-Based Access

1. Login as student
2. Try to access: `/counselor-dashboard`
3. **Expected:** Redirected back to `/dashboard` then `/student-dashboard`

### Test 6: Counselor Registration

1. Logout
2. Clear browser data or use new incognito window
3. Login with different Google account
4. Select "Counselor" role
5. **Expected:** Counselor fields appear (specialization, experience, phone)
6. Fill all required fields
7. Click "Complete Setup & Continue"
8. **Expected:** Redirected to counselor dashboard

---

## 📊 Monitoring & Debugging

### Check Vercel Logs

```bash
vercel logs --follow
```

Or from Vercel Dashboard:
1. Go to your project
2. Click **Logs** tab
3. Select latest deployment
4. Click "View Function Logs"

### Look for These Success Logs:

```
🔐 OAuth Flow Started: { environment: 'production', redirectTo: 'https://your-app.vercel.app/auth/callback' }
✅ Google authentication successful for: user@example.com
📊 User profile check: Not found
💾 Session saved: { email: 'user@example.com', isProfileCompleted: false, role: null }
➡️ Redirecting to profile setup
```

```
📝 Setup profile accessed: { googleAuthenticated: true, isProfileCompleted: false }
```

```
📋 Profile registration attempt: { email: 'user@example.com', role: 'student' }
💾 Creating user profile in database...
✅ User created: { id: '...', email: '...', role: 'student' }
✅ Profile setup complete, redirecting to dashboard
```

```
🏠 Dashboard accessed: { googleAuthenticated: true, isProfileCompleted: true, userRole: 'student' }
✅ Dashboard: Redirecting to student dashboard
```

```
👨‍🎓 Student dashboard accessed: { googleAuthenticated: true, userRole: 'student' }
```

### Look for These Error Logs (if something fails):

```
❌ OAuth callback: missing authorization code
❌ Authentication callback failed: [error details]
❌ Profile registration error: [error details]
⚠️ Dashboard: User not authenticated, redirecting to login
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Still Seeing Redirect Loop

**Symptoms:**
- Redirecting between `/login` and `/dashboard` endlessly
- Logs show: "User not authenticated" repeatedly

**Solutions:**
1. **Check Vercel Environment Variables:**
   - Verify `SESSION_SECRET` is set
   - Must be at least 32 characters
   - Copy/paste carefully (no extra spaces)

2. **Clear Browser Data:**
   - Open Developer Tools (F12)
   - Application → Storage → Clear site data
   - Try in new incognito window

3. **Check Session Cookie:**
   - Open Developer Tools (F12)
   - Application → Cookies
   - Look for `careerpath.sid`
   - If missing, session isn't being created

4. **Check Vercel Logs:**
   - Look for "Session saved" message
   - If missing, SESSION_SECRET might be wrong

### Issue 2: Profile Setup Not Working

**Symptoms:**
- Error message on profile setup page
- Can't submit form
- Database errors in logs

**Solutions:**
1. **Check Supabase Credentials:**
   - Verify `SUPABASE_URL` is correct
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Not the anon key - the SERVICE ROLE key

2. **Check Database Tables:**
   - Go to Supabase Dashboard → Table Editor
   - Verify `users` table exists
   - Verify `counselors` table exists
   - Check table schemas match expected format

3. **Check Vercel Logs:**
   - Look for "Database insertion error"
   - Look for "Counselor mapping error"
   - Error message will tell you what's wrong

### Issue 3: OAuth Not Working

**Symptoms:**
- Clicking "Continue with Google" does nothing
- Redirected back to login with error
- "localhost refused to connect" (old issue)

**Solutions:**
1. **Check OAUTH_REDIRECT_URL:**
   - In Vercel, this should NOT be set
   - If it exists, DELETE it
   - Redeploy

2. **Check Supabase OAuth Settings:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to redirect URLs
   - Format: `https://your-app.vercel.app/auth/callback`

3. **Check Google Cloud Console:**
   - Verify redirect URI includes your Supabase URL
   - Format: `https://your-supabase-id.supabase.co/auth/v1/callback`

### Issue 4: Session Not Persisting

**Symptoms:**
- Logged in but refresh logs you out
- Navigate to another page, need to login again

**Solutions:**
1. **Check NODE_ENV:**
   - Must be set to `production` in Vercel
   - Affects cookie security settings

2. **Check HTTPS:**
   - Vercel URL must use HTTPS
   - Secure cookies require HTTPS

3. **Check Browser Settings:**
   - Cookies must be enabled
   - Not in private/incognito (closes sessions)
   - No ad blockers blocking cookies

---

## 📋 Post-Deployment Checklist

After deployment completes:

- [ ] Verify all environment variables are set in Vercel
- [ ] Check deployment succeeded (green checkmark)
- [ ] Test new user registration flow
- [ ] Test existing user login flow
- [ ] Test session persistence (refresh page)
- [ ] Test logout functionality
- [ ] Test protected route access
- [ ] Test role-based access control
- [ ] Check Vercel logs for errors
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ New users can sign in with Google
2. ✅ New users see profile setup page
3. ✅ Can select Student or Counselor role
4. ✅ Counselor fields show/hide correctly
5. ✅ Profile saves to database successfully
6. ✅ Redirected to correct dashboard after setup
7. ✅ No redirect loops!
8. ✅ Existing users login directly to dashboard
9. ✅ Sessions persist across page refreshes
10. ✅ Logout works and shows success message
11. ✅ Protected routes redirect to login
12. ✅ Vercel logs show success messages

---

## 🆘 Need Help?

If you're still having issues:

1. **Screenshot Vercel Logs:**
   - Show the authentication flow logs
   - Include timestamps

2. **Screenshot Vercel Environment Variables:**
   - Blur out the actual keys
   - Show which variables are set

3. **Describe the Error:**
   - What were you trying to do?
   - What happened instead?
   - What error message did you see?

4. **Browser Console:**
   - Open Developer Tools (F12)
   - Console tab
   - Any errors shown there?

---

**Good Luck! The authentication flow is now properly implemented. 🎉**

**Last Updated:** June 21, 2026
**Deployment:** Automatic via Vercel + GitHub
