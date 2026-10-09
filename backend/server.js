const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize } = require('./models');
const { seedDatabase } = require('./utils/seedData');
const { initCronJobs } = require('./services/cronService');
const { authenticate } = require('./middleware/supabaseAuthMiddleware');
const { isSupabaseConfigured, testConnection, ensureStorageBuckets } = require('./config/supabase');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const examRoutes = require('./routes/examRoutes');
const feeRoutes = require('./routes/feeRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const problemRoutes = require('./routes/problemRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const resourceApiRoutes = require('./routes/resourceApiRoutes');
const codeLabRoutes = require('./routes/codeLabRoutes');
const seedResources = require('./utils/seedResources');
const adminController = require('./controllers/adminController');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Vercel, Cloudflare, AWS) for secure cookies and headers
app.set('trust proxy', 1);

// View Engine with robust fallback resolution
const viewsDir = fs.existsSync(path.join(__dirname, '../views'))
  ? path.join(__dirname, '../views')
  : path.join(process.cwd(), 'views');
app.set('view engine', 'ejs');
app.set('views', viewsDir);

// Static Assets with robust fallback resolution
const publicDir = fs.existsSync(path.join(__dirname, '../public'))
  ? path.join(__dirname, '../public')
  : path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Body Parsers & Cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'campus_ai_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

// Server Initialization & Lifecycle Engine (Vercel Serverless + Standalone Support)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let initPromise = null;
async function initializeApp() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      try {
        await sequelize.query('ALTER TABLE users ADD COLUMN phone VARCHAR(255);');
      } catch (e) {}
      try {
        await sequelize.query('ALTER TABLE users ADD COLUMN designation VARCHAR(255);');
      } catch (e) {}
      try {
        await sequelize.query('ALTER TABLE users ADD COLUMN adminId VARCHAR(255);');
      } catch (e) {}

      await seedDatabase();
      await seedResources();
      if (isSupabaseConfigured) {
        await ensureStorageBuckets();
      }
      if (!isServerless) {
        initCronJobs();
      }
    } catch (error) {
      console.warn('[CAMPUS AI Init Note]:', error.message);
    }
  })();
  return initPromise;
}

// In serverless cold starts, trigger init immediately in background
if (isServerless) {
  initializeApp();
}

// Ensure database/app initialization completes before processing requests
app.use(async (req, res, next) => {
  try {
    await initializeApp();
  } catch (initErr) {
    console.warn('[CAMPUS AI Request Init Warning]:', initErr.message);
  }
  next();
});

// Global Authentication & View State Middleware
app.use(authenticate);
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.appName = 'CAMPUS AI';
  res.locals.appTagline = 'Intelligent Digital Campus Ecosystem';
  next();
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admissions', admissionRoutes);
app.use('/exams', examRoutes);
app.use('/fees', feeRoutes);
app.use('/hostel', hostelRoutes);
app.use('/student', studentRoutes);
app.use('/faculty', facultyRoutes);
app.use('/ai', aiRoutes);
app.use('/problems', problemRoutes);
app.use('/resources', resourceRoutes);
app.use('/ai/resources', resourceRoutes);
app.use('/api/resources', resourceApiRoutes);
app.use('/ai/code-lab', codeLabRoutes);
app.use('/api/code-lab', codeLabRoutes);

// Top-Level Auth Route Aliases
app.get('/login', (req, res) => {
  const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect('/auth/login' + queryStr);
});
app.get('/register', (req, res) => {
  const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect('/auth/register' + queryStr);
});
app.get('/register/:role', (req, res) => {
  res.redirect(`/auth/register?role=${encodeURIComponent(req.params.role)}`);
});

// Root Route handler
app.get('/', (req, res, next) => {
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  if (req.user.role === 'admin') {
    return adminController.getDashboard(req, res, next);
  } else if (req.user.role === 'teacher' || req.user.role === 'faculty') {
    return res.redirect('/faculty/dashboard');
  } else {
    return res.redirect('/student/dashboard');
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    pageTitle: 'Page Not Found — CAMPUS AI',
    message: 'The requested campus page or resource could not be found.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CAMPUS AI Unhandled Server Error]:', err);
  res.status(500).render('errors/500', {
    pageTitle: 'Server Error — CAMPUS AI',
    message: 'An internal server error occurred. Our technical desk has been alerted.'
  });
});

if (!isServerless && require.main === module) {
  // Standalone server mode (local development / container)
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  CAMPUS AI — Intelligent Digital Campus Ecosystem   `);
      console.log(`  Server running live at: http://localhost:${PORT}   `);
      console.log(`  Default Admin: admin@campusai.edu / admin123      `);
      console.log(`  Default Faculty: faculty@campusai.edu / faculty123  `);
      console.log(`  Default Student: student@campusai.edu / student123  `);
      console.log(`====================================================`);
    });
  });
}

// Export Express application for Vercel Serverless Functions
module.exports = app;
