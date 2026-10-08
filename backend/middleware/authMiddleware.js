/**
 * CAMPUS AI — Universal Authentication Middleware
 * Unified wrapper delegating to Supabase RBAC & Authentication Middleware
 * with full dual-mode backwards compatibility.
 */

const supabaseAuth = require('./supabaseAuthMiddleware');

module.exports = {
  ...supabaseAuth,
  authenticate: supabaseAuth.authenticate,
  requireAuth: supabaseAuth.requireAuth,
  requireRole: supabaseAuth.requireRole,
  requireStudent: supabaseAuth.requireStudent,
  requireFaculty: supabaseAuth.requireFaculty,
  requireAdmin: supabaseAuth.requireAdmin,
  JWT_SECRET: supabaseAuth.JWT_SECRET
};

