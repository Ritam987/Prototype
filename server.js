require('dotenv').config({ quiet: true });
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { calculateTestResult } = require('./utils/scoring');
const { getSupabaseClient } = require('./utils/supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
  res.render('student-dashboard', viewData('student-dashboard', {
    title: 'CareerPath | Student Dashboard',
    description: 'Student dashboard for CareerPath career counseling platform.',
    dashboardHref: '/student-dashboard'
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
  res.render('counselor-dashboard', viewData('counselor-dashboard', {
    title: 'CareerPath | Counselor Dashboard',
    description: 'Career counselor dashboard for managing assigned students.',
    dashboardHref: '/counselor-dashboard'
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

app.post('/auth/register', async function (req, res) {
  const role = req.body.role;

  try {
    await upsertRegistration(req.body);
  } catch (error) {
    console.error('Supabase registration sync failed:', error.message);
  }

  if (role === 'counselor') {
    return res.redirect('/counselor-dashboard');
  }

  return res.redirect('/student-dashboard');
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
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();

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
  const supabase = getSupabaseClient();
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
