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
  }
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

  // If OAUTH_REDIRECT_URL is configured and valid, use it
  if (configured) {
    try {
      const url = new URL(configured);
      
      // Security: Block localhost URLs in production
      if (isProduction && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        console.warn('⚠️ SECURITY WARNING: localhost URL detected in production environment. Using request origin instead.');
        return new URL('/auth/callback', getRequestOrigin(req)).toString();
      }
      
      if (url.pathname.replace(/\/+$/, '') === '/auth/callback') {
        return url.toString();
      }
      return new URL('/auth/callback', url.origin).toString();
    } catch (error) {
      console.error('Invalid OAUTH_REDIRECT_URL, falling back to request origin:', error.message);
    }
  }

  // Fallback to dynamic detection from request
  const dynamicUrl = new URL('/auth/callback', getRequestOrigin(req)).toString();
  console.log('Using dynamic OAuth redirect URL:', dynamicUrl);
  return dynamicUrl;
}

function createSessionStorage(req) {
  if (!req.session.supabaseOAuthStorage) {
    req.session.supabaseOAuthStorage = {};
  }

  return {
    getItem(key) {
      return req.session.supabaseOAuthStorage?.[key] || null;
    },
    setItem(key, value) {
      req.session.supabaseOAuthStorage[key] = value;
    },
    removeItem(key) {
      if (req.session.supabaseOAuthStorage) {
        delete req.session.supabaseOAuthStorage[key];
      }
    }
  };
}

function createOAuthClient(req) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage: createSessionStorage(req)
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
  if (!req.session.googleAuthenticated || !req.session.isProfileCompleted) {
    return res.redirect('/login');
  }

  if (req.session.userRole !== 'student') {
    return res.redirect('/dashboard');
  }

  res.render('student-dashboard', viewData('student-dashboard', {
    title: 'CareerPath | Student Dashboard',
    description: 'Student dashboard for CareerPath career counseling platform.',
    dashboardHref: '/student-dashboard',
    userEmail: req.session.userEmail
  }));
});

app.get('/test', function (req, res) {
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
  if (!req.session.googleAuthenticated || !req.session.isProfileCompleted) {
    return res.redirect('/login');
  }

  if (req.session.userRole !== 'counselor') {
    return res.redirect('/dashboard');
  }

  res.render('counselor-dashboard', viewData('counselor-dashboard', {
    title: 'CareerPath | Counselor Dashboard',
    description: 'Career counselor dashboard for managing assigned students.',
    dashboardHref: '/counselor-dashboard',
    userEmail: req.session.userEmail
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

app.get('/auth/google', async (req, res) => {
  const authClient = createOAuthClient(req);
  if (!authClient) return res.status(500).send('Supabase auth client not initialized');

  const redirectTo = getOAuthRedirectUrl(req);
  
  // Debug logging (remove in production if needed)
  console.log('🔐 OAuth Flow Started:', {
    environment: isProduction ? 'production' : 'development',
    redirectTo: redirectTo,
    origin: getRequestOrigin(req)
  });
  
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo
    }
  });

  if (error) return res.status(500).send('Auth Error: ' + error.message);
  if (!data?.url) return res.status(500).send('Auth Error: Google redirect URL was not returned.');

  try {
    await saveSession(req);
    return res.redirect(data.url);
  } catch (err) {
    console.error('OAuth session save error:', err);
    return res.status(500).send('Session Save Error');
  }
});

app.get('/auth/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) {
    return res.redirect('/login?error=missing_code');
  }

  const authClient = createOAuthClient(req);
  if (!authClient) return res.status(500).send('Supabase auth client not initialized');

  try {
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const authUser = data.user || data.session?.user;
    const email = requiredText(authUser?.email).toLowerCase();
    const userName = requiredText(
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email
    );

    if (!email) {
      throw new Error('Authenticated user email was not returned.');
    }

    const existingUser = await findUserProfileByEmail(email);

    req.session.googleAuthenticated = true;
    req.session.userEmail = email;
    req.session.userName = userName;
    req.session.isProfileCompleted = !!existingUser;
    req.session.userRole = existingUser?.role || null;
    delete req.session.supabaseOAuthStorage;

    await saveSession(req);

    if (!existingUser) {
      return res.redirect('/setup-profile');
    }

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Authentication callback failed:', err);
    return res.redirect('/login?error=auth_failed');
  }
});

app.get('/setup-profile', (req, res) => {
  if (!req.session.googleAuthenticated) {
    return res.status(403).send('Error: You must sign in with Google first before accessing this form.');
  }

  if (req.session.isProfileCompleted) {
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
  if (!supabase) return res.status(500).send('Supabase database client not initialized');

  if (!req.session.googleAuthenticated) {
    return res.status(403).send('Unauthorized session state.');
  }

  const email = requiredText(req.body.email).toLowerCase();
  const sessionEmail = requiredText(req.session.userEmail).toLowerCase();
  const role = req.body.role === 'counselor' || req.body.role === 'student'
    ? req.body.role
    : '';
  const name = requiredText(req.body.name);

  if (!email || email !== sessionEmail) {
    return res.status(400).send('Form email does not match the authenticated Google account.');
  }

  if (!role || !name) {
    return res.status(400).send('Missing required fields.');
  }

  try {
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .upsert({ email, role }, { onConflict: 'email' })
      .select('id, email, role')
      .single();

    if (userError) return res.status(500).send('Database insertion error: ' + userError.message);

    if (role === 'counselor') {
      const normalizedSpecialization = normalizeSpecialization(req.body.specialization);
      const rawExperience = requiredText(req.body.experience);

      if (!normalizedSpecialization || !rawExperience) {
        return res.status(400).send('Counselor specialization and experience are required.');
      }

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

      if (counselorError) return res.status(500).send('Counselor mapping error: ' + counselorError.message);
    }

    req.session.userEmail = email;
    req.session.userName = name;
    req.session.userRole = role;
    req.session.isProfileCompleted = true;
    return req.session.save((err) => {
      if (err) return res.status(500).send('Session processing error.');
      return res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('Profile registration error:', err);
    return res.status(500).send('An error occurred while saving your profile');
  }
});

app.get('/dashboard', (req, res) => {
  // Debug: Log session state
  console.log('SESSION @ /dashboard:', {
    googleAuthenticated: req.session.googleAuthenticated,
    isProfileCompleted: req.session.isProfileCompleted,
    userRole: req.session.userRole,
    userEmail: req.session.userEmail
  });

  if (!req.session.googleAuthenticated) {
    return res.redirect('/login');
  }

  if (!req.session.isProfileCompleted) {
    return res.redirect('/setup-profile');
  }

  const role = req.session.userRole || 'student';

  if (role === 'counselor') {
    return res.redirect('/counselor-dashboard');
  }

  if (role === 'student') {
    return res.redirect('/student-dashboard');
  }

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

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.redirect('/login');
    }
    res.redirect('/login');
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
