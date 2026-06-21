require('dotenv').config({ quiet: true });
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { calculateTestResult } = require('./utils/scoring');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Supabase URL or anon key is missing!');
}

if (!supabaseServiceRoleKey) {
  console.error('CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing; server-side profile database operations will fail.');
}

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'career_path_secret_key_change_in_production';
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'careerpath.sid' // Give the session cookie a specific name
}));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function viewData(page, extra = {}) {
  return {
    page: page,
    dashboardHref: extra.dashboardHref || '/login',
    ...extra
  };
}

function getRequestOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : String(forwardedProto || req.protocol).split(',')[0].trim();
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : String(forwardedHost || req.get('host')).split(',')[0].trim();

  return `${proto}://${host}`;
}

function getOAuthRedirectUrl(req) {
  const configured = requiredText(process.env.OAUTH_REDIRECT_URL);
  const requestOrigin = getRequestOrigin(req);

  // Debug logging to help identify issues
  console.log('🔍 OAuth Redirect Debug:', {
    OAUTH_REDIRECT_URL_env: configured || '(empty)',
    requestOrigin: requestOrigin,
    isProduction: isProduction,
    NODE_ENV: process.env.NODE_ENV,
    forwardedProto: req.headers['x-forwarded-proto'],
    forwardedHost: req.headers['x-forwarded-host'],
    protocol: req.protocol,
    host: req.get('host')
  });

  // If OAUTH_REDIRECT_URL is configured and valid, use it
  if (configured) {
    try {
      const url = new URL(configured);
      
      // Security: Block localhost URLs in production
      if (isProduction && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        console.warn('⚠️ SECURITY WARNING: localhost URL detected in production environment. Using request origin instead.');
        return new URL('/auth/callback', requestOrigin).toString();
      }
      
      if (url.pathname.replace(/\/+$/, '') === '/auth/callback') {
        console.log('✅ Using configured OAuth redirect:', url.toString());
        return url.toString();
      }
      const finalUrl = new URL('/auth/callback', url.origin).toString();
      console.log('✅ Using configured OAuth redirect (adjusted path):', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('❌ Invalid OAUTH_REDIRECT_URL, falling back to request origin:', error.message);
    }
  }

  // Fallback to dynamic detection from request
  const dynamicUrl = new URL('/auth/callback', requestOrigin).toString();
  console.log('✅ Using dynamic OAuth redirect URL:', dynamicUrl);
  return dynamicUrl;
}

function createSessionStorage(req) {
  // Ensure supabaseOAuthStorage exists
  if (!req.session.supabaseOAuthStorage) {
    req.session.supabaseOAuthStorage = {};
  }

  return {
    getItem(key) {
      const value = req.session.supabaseOAuthStorage?.[key] || null;
      console.log('📦 Session Storage GET:', key, value ? '(exists)' : '(null)');
      return value;
    },
    setItem(key, value) {
      req.session.supabaseOAuthStorage[key] = value;
      console.log('💾 Session Storage SET:', key, '(stored)');
      // Force save session immediately
      req.session.save((err) => {
        if (err) console.error('❌ Session save error:', err);
      });
    },
    removeItem(key) {
      if (req.session.supabaseOAuthStorage) {
        delete req.session.supabaseOAuthStorage[key];
        console.log('🗑️ Session Storage REMOVE:', key);
      }
    }
  };
}

function createOAuthClient(req) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing');
    return null;
  }

  console.log('🔧 Creating OAuth client with session storage');
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage: createSessionStorage(req),
      storageKey: 'supabase-auth-token'
    }
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function findUserProfileByEmail(email) {
  if (!supabase) {
    throw new Error('Supabase database client not initialized');
  }

  const response = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle();

  if (response.error) {
    throw response.error;
  }

  return response.data;
}

app.get('/', function (req, res) {
  res.render('index', viewData('home', {
    title: 'CareerPath | Secure Your Career Path',
    description: 'Secure your career path with trusted counseling and psychometric assessments.',
    showPreloader: true,
    footerText: 'Empowering students with trusted career counseling and psychometric assessments across Hyderabad, Hajipur, and Kolkata.'
  }));
});

app.get('/login', function (req, res) {
  res.render('login-signup', viewData('login', {
    title: 'CareerPath | Login & Sign Up',
    description: 'Sign up or log in to CareerPath career counseling platform.',
    showPreloader: true
  }));
});

app.get('/student-dashboard', function (req, res) {
  console.log('👨‍🎓 Student dashboard accessed:', {
    googleAuthenticated: req.session.googleAuthenticated,
    isProfileCompleted: req.session.isProfileCompleted,
    userRole: req.session.userRole
  });

  if (!req.session.googleAuthenticated || !req.session.isProfileCompleted) {
    console.warn('⚠️ Student dashboard: Unauthorized access, redirecting to login');
    return res.redirect('/login?error=auth_required');
  }

  if (req.session.userRole !== 'student') {
    console.warn('⚠️ Student dashboard: Wrong role, redirecting to dashboard');
    return res.redirect('/dashboard');
  }

  res.render('student-dashboard', viewData('student-dashboard', {
    title: 'CareerPath | Student Dashboard',
    description: 'Student dashboard for CareerPath career counseling platform.',
    dashboardHref: '/student-dashboard',
    userEmail: req.session.userEmail,
    userName: req.session.userName
  }));
});

app.get('/test', function (req, res) {
  console.log('📝 Test page accessed');
  
  if (!req.session.googleAuthenticated || !req.session.isProfileCompleted) {
    console.warn('⚠️ Test: Unauthorized access, redirecting to login');
    return res.redirect('/login?error=auth_required');
  }
  
  res.render('test', viewData('test', {
    title: 'CareerPath | Psychometric Test',
    description: 'Complete your 50-question psychometric career assessment.',
    dashboardHref: '/student-dashboard'
  }));
});

app.get('/report', function (req, res) {
  res.render('report', viewData('report', {
    title: 'CareerPath | Career Assessment Report',
    description: 'View your personalized career assessment report.',
    dashboardHref: '/student-dashboard',
    report: null
  }));
});

app.get('/counselor-dashboard', function (req, res) {
  console.log('👨‍💼 Counselor dashboard accessed:', {
    googleAuthenticated: req.session.googleAuthenticated,
    isProfileCompleted: req.session.isProfileCompleted,
    userRole: req.session.userRole
  });

  if (!req.session.googleAuthenticated || !req.session.isProfileCompleted) {
    console.warn('⚠️ Counselor dashboard: Unauthorized access, redirecting to login');
    return res.redirect('/login?error=auth_required');
  }

  if (req.session.userRole !== 'counselor') {
    console.warn('⚠️ Counselor dashboard: Wrong role, redirecting to dashboard');
    return res.redirect('/dashboard');
  }

  res.render('counselor-dashboard', viewData('counselor-dashboard', {
    title: 'CareerPath | Counselor Dashboard',
    description: 'Career counselor dashboard for managing assigned students.',
    dashboardHref: '/counselor-dashboard',
    userEmail: req.session.userEmail,
    userName: req.session.userName
  }));
});

app.get('/about', function (req, res) {
  res.render('about', viewData('about', {
    title: 'CareerPath | About Us',
    description: 'Learn about CareerPath mission and grassroots career counseling impact.'
  }));
});

app.get('/contact', function (req, res) {
  res.render('contact', viewData('contact', {
    title: 'CareerPath | Contact Us',
    description: 'Contact CareerPath for career counseling support.'
  }));
});

app.get('/faqs', function (req, res) {
  res.render('faqs', viewData('faqs', {
    title: 'CareerPath | FAQs',
    description: 'Frequently asked questions about CareerPath career counseling platform.'
  }));
});

app.get('/privacy', function (req, res) {
  res.render('privacy', viewData('privacy', {
    title: 'CareerPath | Privacy Policy',
    description: 'CareerPath privacy policy and data protection practices.'
  }));
});

// Diagnostic endpoint to check configuration (only for debugging)
app.get('/api/config-check', function (req, res) {
  // Only allow in development or when specifically enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CONFIG_CHECK !== 'true') {
    return res.status(404).send('Not found');
  }

  res.json({
    environment: process.env.NODE_ENV,
    isProduction: isProduction,
    requestOrigin: getRequestOrigin(req),
    oauthRedirectUrl: getOAuthRedirectUrl(req),
    headers: {
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'host': req.get('host')
    },
    envVars: {
      OAUTH_REDIRECT_URL: process.env.OAUTH_REDIRECT_URL ? '(set)' : '(empty)',
      SUPABASE_URL: process.env.SUPABASE_URL ? '(set)' : '(missing)',
      PORT: process.env.PORT
    }
  });
});

app.get('/auth/google', async (req, res) => {
  console.log('🔐 Starting Google OAuth flow...');
  
  const authClient = createOAuthClient(req);
  if (!authClient) {
    console.error('❌ Supabase auth client not initialized');
    return res.status(500).send('Supabase auth client not initialized');
  }

  const redirectTo = getOAuthRedirectUrl(req);
  
  console.log('🔐 OAuth Flow Configuration:', {
    environment: isProduction ? 'production' : 'development',
    redirectTo: redirectTo,
    origin: getRequestOrigin(req),
    sessionID: req.sessionID
  });
  
  try {
    const { data, error } = await authClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('❌ OAuth error:', error);
      return res.redirect('/login?error=auth_failed');
    }
    
    if (!data?.url) {
      console.error('❌ No OAuth URL returned');
      return res.redirect('/login?error=auth_failed');
    }

    console.log('✅ OAuth URL generated, saving session...');
    
    // Force save session before redirect
    await saveSession(req);
    
    console.log('✅ Session saved, redirecting to Google...');
    return res.redirect(data.url);
    
  } catch (err) {
    console.error('❌ OAuth flow error:', err);
    return res.redirect('/login?error=auth_failed');
  }
});

app.get('/auth/callback', async (req, res) => {
  console.log('🔄 OAuth callback received');
  console.log('📍 Callback URL:', req.url);
  console.log('📍 Query params:', req.query);
  console.log('📍 Session ID:', req.sessionID);
  
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const error_code = req.query.error;
  const error_description = req.query.error_description;
  
  // Check for OAuth errors from Google
  if (error_code) {
    console.error('❌ OAuth error from provider:', {
      error: error_code,
      description: error_description
    });
    return res.redirect('/login?error=auth_failed');
  }
  
  if (!code) {
    console.error('❌ OAuth callback: missing authorization code');
    console.error('❌ Full query:', req.query);
    return res.redirect('/login?error=missing_code');
  }

  console.log('✅ Authorization code received');
  
  const authClient = createOAuthClient(req);
  if (!authClient) {
    console.error('❌ OAuth callback: Supabase client not initialized');
    return res.redirect('/login?error=auth_failed');
  }

  try {
    console.log('🔄 Exchanging authorization code for session...');
    console.log('📦 Session storage check:', req.session.supabaseOAuthStorage);
    
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('❌ Exchange code error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return res.redirect('/login?error=auth_failed');
    }
    
    if (!data || !data.session || !data.user) {
      console.error('❌ No session or user data returned');
      console.error('❌ Data received:', data);
      return res.redirect('/login?error=auth_failed');
    }

    const authUser = data.user;
    const session = data.session;
    const email = requiredText(authUser?.email).toLowerCase();
    const userName = requiredText(
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email
    );

    if (!email) {
      console.error('❌ No email in user data');
      return res.redirect('/login?error=auth_failed');
    }

    console.log('✅ Google authentication successful for:', email);
    console.log('✅ Session data:', {
      access_token: session.access_token ? '(exists)' : '(missing)',
      refresh_token: session.refresh_token ? '(exists)' : '(missing)',
      expires_at: session.expires_at
    });

    // Check if user profile exists in database
    console.log('🔍 Checking user profile in database...');
    const existingUser = await findUserProfileByEmail(email);
    console.log('📊 User profile check:', existingUser ? 'Found' : 'Not found');
    
    if (existingUser) {
      console.log('📊 Existing user data:', {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role
      });
    }

    // Store Supabase session data
    req.session.supabaseSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at
    };

    // Set session data
    req.session.googleAuthenticated = true;
    req.session.userEmail = email;
    req.session.userName = userName;
    req.session.isProfileCompleted = !!existingUser;
    req.session.userRole = existingUser?.role || null;
    req.session.userId = existingUser?.id || null;
    
    // Clear OAuth storage (no longer needed)
    delete req.session.supabaseOAuthStorage;

    // Force save session before redirect
    await saveSession(req);
    
    console.log('💾 Session saved:', {
      email: req.session.userEmail,
      isProfileCompleted: req.session.isProfileCompleted,
      role: req.session.userRole,
      sessionID: req.sessionID
    });

    // Redirect based on profile completion
    if (!existingUser) {
      console.log('➡️ Redirecting to profile setup (new user)');
      return res.redirect('/setup-profile');
    }

    console.log('➡️ Redirecting to dashboard (existing user)');
    return res.redirect('/dashboard');
    
  } catch (err) {
    console.error('❌ Authentication callback failed:', err);
    console.error('❌ Error stack:', err.stack);
    return res.redirect('/login?error=auth_failed');
  }
});

app.get('/setup-profile', (req, res) => {
  console.log('📝 Setup profile accessed:', {
    googleAuthenticated: req.session.googleAuthenticated,
    isProfileCompleted: req.session.isProfileCompleted,
    userEmail: req.session.userEmail
  });

  if (!req.session.googleAuthenticated) {
    console.warn('⚠️ Setup profile: User not authenticated, redirecting to login');
    return res.redirect('/login?error=auth_required');
  }

  if (req.session.isProfileCompleted) {
    console.log('✅ Setup profile: Profile already complete, redirecting to dashboard');
    return res.redirect('/dashboard');
  }

  const email = req.session.userEmail || '';
  const name = req.session.userName || '';

  res.render('setup-profile', viewData('setup-profile', {
    title: 'CareerPath | Complete Your Profile',
    description: 'Complete your profile to get started with CareerPath.',
    email: email,
    name: name,
    googleAuthenticated: true
  }));
});

app.post('/auth/register-profile', async (req, res) => {
  console.log('📋 Profile registration attempt:', {
    email: req.body.email,
    role: req.body.role,
    sessionAuth: req.session.googleAuthenticated
  });

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return res.status(500).send('Supabase database client not initialized');
  }

  if (!req.session.googleAuthenticated) {
    console.error('❌ Unauthorized session state');
    return res.status(403).send('Unauthorized session state.');
  }

  const email = requiredText(req.body.email).toLowerCase();
  const sessionEmail = requiredText(req.session.userEmail).toLowerCase();
  const role = req.body.role === 'counselor' || req.body.role === 'student'
    ? req.body.role
    : '';
  const name = requiredText(req.body.name);

  if (!email || email !== sessionEmail) {
    console.error('❌ Email mismatch:', { provided: email, session: sessionEmail });
    return res.status(400).send('Form email does not match the authenticated Google account.');
  }

  if (!role || !name) {
    console.error('❌ Missing required fields');
    return res.status(400).send('Missing required fields.');
  }

  try {
    console.log('💾 Creating user profile in database...');
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .upsert({ email, role }, { onConflict: 'email' })
      .select('id, email, role')
      .single();

    if (userError) {
      console.error('❌ Database error:', userError);
      return res.status(500).send('Database insertion error: ' + userError.message);
    }

    console.log('✅ User created:', newUser);

    if (role === 'counselor') {
      const normalizedSpecialization = normalizeSpecialization(req.body.specialization);
      const rawExperience = requiredText(req.body.experience);

      if (!normalizedSpecialization || !rawExperience) {
        console.error('❌ Missing counselor fields');
        return res.status(400).send('Counselor specialization and experience are required.');
      }

      console.log('💾 Creating counselor profile...');
      
      const { error: counselorError } = await supabase
        .from('counselors')
        .upsert({
          id: newUser.id,
          name: name,
          specialization: normalizedSpecialization,
          experience: parseExperience(rawExperience),
          email,
          phone: requiredText(req.body.phone) || 'Not provided'
        }, { onConflict: 'id' });

      if (counselorError) {
        console.error('❌ Counselor profile error:', counselorError);
        return res.status(500).send('Counselor mapping error: ' + counselorError.message);
      }
      
      console.log('✅ Counselor profile created');
    }

    // Update session with complete profile data
    req.session.userEmail = email;
    req.session.userName = name;
    req.session.userRole = role;
    req.session.userId = newUser.id;
    req.session.isProfileCompleted = true;
    
    // Save session and redirect
    return req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).send('Session processing error.');
      }
      
      console.log('✅ Profile setup complete, redirecting to dashboard');
      return res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('❌ Profile registration error:', err);
    return res.status(500).send('An error occurred while saving your profile');
  }
});

app.get('/dashboard', (req, res) => {
  console.log('🏠 Dashboard accessed:', {
    googleAuthenticated: req.session.googleAuthenticated,
    isProfileCompleted: req.session.isProfileCompleted,
    userRole: req.session.userRole,
    userEmail: req.session.userEmail,
    sessionID: req.sessionID
  });

  // Check authentication
  if (!req.session.googleAuthenticated) {
    console.warn('⚠️ Dashboard: User not authenticated, redirecting to login');
    return res.redirect('/login?error=auth_required');
  }

  // Check profile completion
  if (!req.session.isProfileCompleted) {
    console.warn('⚠️ Dashboard: Profile not completed, redirecting to setup');
    return res.redirect('/setup-profile');
  }

  const role = req.session.userRole || 'student';
  console.log('✅ Dashboard: Redirecting to', role, 'dashboard');

  if (role === 'counselor') {
    return res.redirect('/counselor-dashboard');
  }

  if (role === 'student') {
    return res.redirect('/student-dashboard');
  }

  console.error('❌ Dashboard: Invalid role, redirecting to login');
  return res.redirect('/login');
});

app.post('/auth/register', async function (req, res) {
  return res.status(410).send('Email/password authentication is disabled. Please sign in with Google.');
});

app.post('/submit-test', async function (req, res) {
  const payload = req.body.answers || req.body;
  let answers = payload;

  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers);
    } catch (error) {
      console.error('Failed to parse submitted answers:', error.message);
      answers = req.body;
    }
  }

  const report = calculateTestResult(answers);

  try {
    const persistence = await persistTestResult(report, req.body);
    if (persistence.counselor) {
      report.counselor = persistence.counselor;
    }
    if (persistence.testResultId) {
      report.testResultId = persistence.testResultId;
    }
  } catch (error) {
    console.error('Supabase test result sync failed:', error.message);
  }

  res.render('report', viewData('report', {
    title: 'CareerPath | Career Assessment Report',
    description: 'View your personalized career assessment report.',
    dashboardHref: '/student-dashboard',
    report: report
  }));
});

app.get('/logout', async (req, res) => {
  const userEmail = req.session.userEmail;
  console.log('👋 Logout request from:', userEmail || 'anonymous');
  
  // Try to sign out from Supabase if we have session data
  if (req.session.supabaseSession) {
    try {
      const authClient = createOAuthClient(req);
      if (authClient) {
        console.log('🔓 Signing out from Supabase...');
        await authClient.auth.signOut();
      }
    } catch (err) {
      console.error('⚠️ Supabase signout error:', err);
      // Continue with session destruction even if Supabase signout fails
    }
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Session destroy error:', err);
      return res.redirect('/login');
    }
    
    console.log('✅ User logged out successfully');
    res.clearCookie('careerpath.sid');
    res.redirect('/login?logout=success');
  });
});

app.use(function (req, res) {
  res.status(404).send('Page not found');
});

function normalizeSpecialization(value) {
  const map = {
    technical: 'IT/Engineering',
    sales: 'Sales/Marketing',
    finance: 'Finance/Accounting',
    teaching: 'Teaching/Social Work',
    'IT / Engineering': 'IT/Engineering',
    'Sales / Marketing': 'Sales/Marketing',
    'Finance / Accounting': 'Finance/Accounting',
    'Teaching / Social Work': 'Teaching/Social Work',
    'IT/Engineering': 'IT/Engineering',
    'Sales/Marketing': 'Sales/Marketing',
    'Finance/Accounting': 'Finance/Accounting',
    'Teaching/Social Work': 'Teaching/Social Work'
  };
  return map[value] || null;
}

function parseExperience(value) {
  if (typeof value === 'number') return value;
  const match = String(value || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function requiredText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function upsertRegistration(body) {
  const email = requiredText(body.email).toLowerCase();

  if (!supabase || !email) {
    return null;
  }

  const role = body.role === 'counselor' ? 'counselor' : 'student';
  const userRow = {
    email: email,
    role: role
  };

  const userResponse = await supabase
    .from('users')
    .upsert(userRow, { onConflict: 'email' })
    .select('id, email, role')
    .single();

  if (userResponse.error) {
    throw userResponse.error;
  }

  if (role === 'counselor') {
    const specialization = normalizeSpecialization(body.specialization);

    if (!specialization) {
      throw new Error('Invalid counselor specialization');
    }

    const counselorResponse = await supabase
      .from('counselors')
      .upsert({
        id: userResponse.data.id,
        name: requiredText(body.name) || 'Career Counselor',
        specialization: specialization,
        experience: parseExperience(body.experience),
        email: email,
        phone: requiredText(body.phone) || 'Not provided'
      }, { onConflict: 'id' });

    if (counselorResponse.error) {
      throw counselorResponse.error;
    }
  }

  return userResponse.data;
}

async function persistTestResult(report, body) {
  if (!supabase) {
    return {};
  }

  const studentEmail = requiredText(body.studentEmail || body.email).toLowerCase();
  let studentId = null;

  if (studentEmail) {
    const userResponse = await supabase
      .from('users')
      .upsert({ email: studentEmail, role: 'student' }, { onConflict: 'email' })
      .select('id')
      .single();

    if (userResponse.error) {
      throw userResponse.error;
    }

    studentId = userResponse.data.id;
  }

  const counselor = await assignCounselor(report.recommendedPath);
  const resultResponse = await supabase
    .from('test_results')
    .insert({
      student_id: studentId,
      score_aptitude: report.scores.aptitude,
      score_personality: report.scores.personality,
      score_interest: report.scores.careerInterests,
      score_ei: report.scores.emotionalIntelligence,
      score_skills: report.scores.skills,
      recommended_path: report.recommendedPath,
      assigned_counselor_id: counselor ? counselor.id : null,
      status: 'pending'
    })
    .select('id')
    .single();

  if (resultResponse.error) {
    throw resultResponse.error;
  }

  return {
    counselor: counselor ? toReportCounselor(counselor) : null,
    testResultId: resultResponse.data.id
  };
}

async function assignCounselor(recommendedPath) {
  const response = await supabase.rpc('assign_random_counselor', {
    requested_specialization: recommendedPath
  });

  if (response.error) {
    throw response.error;
  }

  if (Array.isArray(response.data)) {
    return response.data[0] || null;
  }

  return response.data || null;
}

function toReportCounselor(counselor) {
  return {
    name: counselor.name,
    specialization: counselor.specialization,
    email: counselor.email,
    phone: counselor.phone
  };
}

if (require.main === module) {
  app.listen(PORT, function () {
    console.log('CareerPath server is running on http://localhost:' + PORT);
  });
}

module.exports = app;
module.exports.supabase = supabase;
