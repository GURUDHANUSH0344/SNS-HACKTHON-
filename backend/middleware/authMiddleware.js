const jwt = require('jsonwebtoken');
const { User, Student, FacultyProfile } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_ai_jwt_super_secret_key_2026';

const authenticate = async (req, res, next) => {
  try {
    // 1. Check session
    let token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    
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

    // Verify JWT
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
    next();
  } catch (error) {
    req.user = null;
    res.locals.currentUser = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }
      return res.redirect('/auth/login');
    }

    // Role mapping: 'teacher' and 'faculty' can be interchangeable
    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole) || 
      (allowedRoles.includes('teacher') && userRole === 'faculty') ||
      (allowedRoles.includes('faculty') && userRole === 'teacher') ||
      userRole === 'admin'; // admin can access all roles or specific ones if needed

    if (!isAllowed) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ success: false, message: 'Access denied: insufficient privileges.' });
      }
      return res.status(403).render('errors/403', {
        pageTitle: 'Access Denied',
        message: 'You do not have permission to access this portal or resource.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireAuth,
  requireRole,
  JWT_SECRET
};
