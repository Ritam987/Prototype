# 🎓 CareerPath - Career Counselling Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

> **CareerPath** is a comprehensive web-based career counseling platform that empowers students with trusted psychometric assessments and personalized career guidance. Serving communities across Hyderabad, Hajipur, and Kolkata.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### For Students
- 🔐 **Secure Google OAuth Authentication** - Sign in securely with your Google account
- 📝 **50-Question Psychometric Assessment** - Comprehensive career aptitude testing
- 📊 **Personalized Career Reports** - Detailed analysis with recommended career paths
- 👤 **Student Dashboard** - Track your assessment progress and results
- 🎯 **Career Path Recommendations** - AI-driven career suggestions based on:
  - Aptitude scores
  - Personality traits
  - Career interests
  - Emotional intelligence
  - Skills assessment

### For Counselors
- 👥 **Counselor Dashboard** - Manage and track assigned students
- 🔄 **Automatic Student Assignment** - Smart matching based on specialization
- 📈 **Student Progress Tracking** - Monitor assessment results and status
- 💼 **Specialization Areas**:
  - IT/Engineering
  - Sales/Marketing
  - Finance/Accounting
  - Teaching/Social Work

### Additional Features
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔒 **Secure Session Management** - Protected user sessions with httpOnly cookies
- 🌐 **Multi-page Architecture** - About, Contact, FAQs, Privacy Policy pages
- 🎨 **Modern UI/UX** - Clean, intuitive interface with smooth animations

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **EJS** - Embedded JavaScript templating
- **Supabase** - Backend-as-a-Service (PostgreSQL database, authentication)
- **Express Session** - Session management middleware

### Frontend
- **HTML5/CSS3** - Modern web standards
- **JavaScript (Vanilla)** - Client-side interactivity
- **Responsive Design** - Mobile-first approach

### Database
- **PostgreSQL** (via Supabase) - Relational database with:
  - Users table (students & counselors)
  - Test results table
  - Counselors profile table
  - Row Level Security (RLS) policies

### Authentication
- **Google OAuth 2.0** - Secure authentication via Supabase Auth
- **PKCE Flow** - Enhanced security for OAuth flow

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager (comes with Node.js)
- **Git** - Version control system
- **Supabase Account** - [Sign up](https://supabase.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/careerpath.git
cd careerpath
```

### 2. Install Dependencies

```bash
npm install
```

## ⚙️ Configuration

### 1. Create Environment File

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Configuration
SESSION_SECRET=your_random_secret_key_min_32_characters

# OAuth Configuration
# IMPORTANT: For production (Vercel), leave this EMPTY
# The app will automatically detect your production URL
# For local development only: http://localhost:3000
OAUTH_REDIRECT_URL=

# PostgreSQL Configuration (for local Supabase)
POSTGRES_DB=careerpath
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_PORT=54322
SUPABASE_POSTGRES_IMAGE=supabase/postgres:15.14.1.138_amd64
```

### 3. Set Up Supabase

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Copy your project URL and keys to `.env` file

#### Set Up Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'counselor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create counselors table
CREATE TABLE counselors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience INTEGER DEFAULT 0,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_results table
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score_aptitude INTEGER,
  score_personality INTEGER,
  score_interest INTEGER,
  score_ei INTEGER,
  score_skills INTEGER,
  recommended_path TEXT,
  assigned_counselor_id UUID REFERENCES counselors(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to assign random counselor
CREATE OR REPLACE FUNCTION assign_random_counselor(requested_specialization TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  specialization TEXT,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.specialization, c.email, c.phone
  FROM counselors c
  WHERE c.specialization = requested_specialization
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

#### Configure Google OAuth
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your authorized redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.vercel.app/auth/callback`

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm start
```

The application will be available at `http://localhost:3000`

### Using Docker Compose (with local Supabase)

```bash
docker-compose up -d
```

### Production Mode

```bash
NODE_ENV=production npm start
```

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Add all variables from `.env` EXCEPT `OAUTH_REDIRECT_URL`
   - **CRITICAL:** Leave `OAUTH_REDIRECT_URL` empty or unset in Vercel (the app will auto-detect)
   - Never set `OAUTH_REDIRECT_URL` to localhost in production
   - Set `NODE_ENV=production`

4. **Update Supabase OAuth Redirect URLs**:
   - Add your Vercel domain to authorized redirect URLs
   - Use pattern: `https://your-project-name-*.vercel.app/auth/callback` for preview deployments

5. **Verify Deployment**:
```bash
# Check logs for OAuth redirect URL
vercel logs your-project-name --follow
```

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions on fixing OAuth redirect issues.

The project includes a `vercel.json` configuration file that handles:
- Node.js serverless function deployment
- Static file serving from `public/` directory
- Proper routing for both static assets and API endpoints

## 📁 Project Structure

```
careerpath/
├── .agents/                    # AI agent skills and configurations
├── Assets/                     # Project documentation and assets
├── public/                     # Static files
│   ├── css/                   # Stylesheets
│   ├── js/                    # Client-side JavaScript
│   └── assets/                # Images, fonts, etc.
├── views/                      # EJS templates
│   ├── partials/              # Reusable view components
│   ├── index.ejs              # Homepage
│   ├── login-signup.ejs       # Authentication page
│   ├── setup-profile.ejs      # Profile completion
│   ├── student-dashboard.ejs  # Student dashboard
│   ├── counselor-dashboard.ejs # Counselor dashboard
│   ├── test.ejs               # Psychometric test
│   ├── report.ejs             # Assessment report
│   └── ...                    # Other pages
├── utils/                      # Utility modules
│   ├── scoring.js             # Test scoring algorithm
│   ├── questionsData.js       # Test questions
│   └── supabaseClient.js      # Supabase client setup
├── supabase/                   # Supabase configuration
├── server.js                   # Main application entry point
├── package.json                # Project dependencies
├── vercel.json                 # Vercel deployment config
├── docker-compose.yml          # Docker configuration
└── .env                        # Environment variables (not in git)
```

## 🔌 API Endpoints

### Public Routes
- `GET /` - Homepage
- `GET /about` - About page
- `GET /contact` - Contact page
- `GET /faqs` - FAQs page
- `GET /privacy` - Privacy policy

### Authentication Routes
- `GET /login` - Login/signup page
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/callback` - OAuth callback handler
- `GET /setup-profile` - Complete user profile
- `POST /auth/register-profile` - Submit profile data
- `GET /logout` - Logout user

### Protected Routes
- `GET /dashboard` - Role-based dashboard redirect
- `GET /student-dashboard` - Student dashboard
- `GET /counselor-dashboard` - Counselor dashboard
- `GET /test` - Psychometric test
- `POST /submit-test` - Submit test answers
- `GET /report` - View assessment report

## 🧪 Psychometric Assessment

The platform includes a comprehensive 50-question assessment covering:

1. **Aptitude** - Problem-solving and analytical skills
2. **Personality** - Character traits and work style
3. **Career Interests** - Field preferences and passions
4. **Emotional Intelligence** - Self-awareness and social skills
5. **Skills Assessment** - Technical and soft skills evaluation

### Scoring Algorithm
The scoring system (`utils/scoring.js`) analyzes responses and generates:
- Individual category scores
- Overall assessment score
- Career path recommendations
- Personalized counselor matching

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ES6+ JavaScript features
- Follow consistent indentation (2 spaces)
- Add comments for complex logic
- Test thoroughly before submitting

## 🔒 Security Considerations

- Environment variables are never committed to version control
- Sessions use httpOnly cookies to prevent XSS attacks
- CSRF protection for form submissions
- SQL injection prevention via Supabase prepared statements
- Row Level Security (RLS) policies in database
- OAuth 2.0 with PKCE flow for secure authentication

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead** - [Your Name]
- **Contributors** - See [Contributors](https://github.com/yourusername/careerpath/contributors)

## 📧 Contact

For questions, suggestions, or support:

- **Email**: contact@careerpath.com
- **Website**: [https://careerpath.vercel.app](https://careerpath.vercel.app)
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/careerpath/issues)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Hosting platform
- [Express.js](https://expressjs.com/) - Web framework
- [Node.js](https://nodejs.org/) - Runtime environment

---

**Made with ❤️ for students seeking their career path**
