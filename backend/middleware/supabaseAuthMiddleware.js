/**
 * CAMPUS AI — Supabase RBAC & Authentication Middleware
 * 
 * Verifies Supabase Auth sessions, looks up application-level profile from PostgreSQL,
 * enforces server-side Role-Based Access Control (Student, Faculty, Admin),
 * and provides dual-mode compatibility during incremental migration.
 */

const jwt = require('jsonwebtoken');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const { User, Student, FacultyProfile } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_ai_jwt_super_secret_key_2026';

/**
 * Universal Authentication Middleware
 * Checks Supabase Auth token, fetches profile from Supabase PostgreSQL,
 * and maintains seamless backwards compatibility with existing sessions.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = 
      req.cookies?.token || 
      req.cookies?.['sb-access-token'] || 
      req.headers?.authorization?.replace('Bearer ', '');

    // Check express-session as backup
    if (!token && req.session?.user) {
      req.user = req.session.user;
      res.locals.currentUser = req.user;
      return next();
    }

    if (!token) {
      req.user = null;
      res.locals.currentUser = null;
      return next();
    }

    // 1. Try Supabase Auth verification if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authData?.user) {
          const authUser = authData.user;
          // Retrieve application profile
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select(`
              *,
              students:students(*),
              faculty_profiles:faculty_profiles(*)
            `)
            .eq('auth_user_id', authUser.id)
            .single();

          if (profile && profile.status === 'active') {
            req.user = {
              id: profile.id,
              authUserId: authUser.id,
              email: profile.email,
              name: profile.full_name,
              role: profile.role,
              department: profile.department_name,
              status: profile.status,
              profilePhoto: profile.profile_photo_url,
              studentProfile: profile.students?.[0] || null,
              facultyProfile: profile.faculty_profiles?.[0] || null
            };

            if (req.session) req.session.user = req.user;
            res.locals.currentUser = req.user;
            return next();
          }
        }
      } catch (sbErr) {
        // Fall through to legacy JWT verification
      }
    }

    // 2. Fallback to Local JWT / SQLite session verification during migration
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: Student, as: 'studentProfile' },
          { model: FacultyProfile, as: 'facultyProfile' }
        ]
      });

      if (!user || user.status !== 'active') {
        req.user = null;
        res.locals.currentUser = null;
        res.clearCookie('token');
        if (req.session) req.session.user = null;
        return next();
      }

      req.user = user.toJSON();
      if (req.session) req.session.user = req.user;
      res.locals.currentUser = req.user;
      return next();
    } catch (jwtErr) {
      req.user = null;
      res.locals.currentUser = null;
      return next();
    }
  } catch (error) {
    req.user = null;
    res.locals.currentUser = null;
    return next();
  }
};

/**
 * Enforce that user is authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

/**
 * Enforce specific role access
 * @param {Array<string>} allowedRoles 
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }
      return res.redirect('/auth/login');
    }

    const userRole = (req.user.role || '').toLowerCase();
    // Normalize teacher <-> faculty
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const isAllowed = 
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes('faculty') && userRole === 'teacher') ||
      (normalizedAllowed.includes('teacher') && userRole === 'faculty') ||
      userRole === 'admin'; // Administrator has overarching governance privilege

    if (!isAllowed) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ success: false, message: 'Access denied: insufficient role privileges.' });
      }
      return res.status(403).render('errors/403', {
        pageTitle: 'Access Denied — CAMPUS AI',
        message: 'You do not have permission to access this portal or resource.'
      });
    }

    next();
  };
};

// Role-specific helpers as requested in Master Prompt Section 14
const requireStudent = requireRole(['student']);
const requireFaculty = requireRole(['faculty', 'teacher']);
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticate,
  requireAuth,
  requireRole,
  requireStudent,
  requireFaculty,
  requireAdmin,
  JWT_SECRET
};
