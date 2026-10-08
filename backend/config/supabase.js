/**
 * CAMPUS AI — Supabase Centralized Client & Infrastructure Configuration
 * 
 * Provides:
 * 1. Public client (anon key) for user-scoped interactions.
 * 2. Administrative service-role client (service-role key) strictly on server.
 * 3. Graceful connectivity verification and error sanitization.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';

// Validation helper
const isUrlValid = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  isUrlValid(SUPABASE_URL) && 
  (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)
);

let supabase = null;
let supabaseAdmin = null;

if (isSupabaseConfigured) {
  try {
    // 1. Client for public / authenticated user context
    if (SUPABASE_ANON_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    }

    // 2. Administrative client with Service Role Key (STRICTLY SERVER-SIDE)
    const adminKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    supabaseAdmin = createClient(SUPABASE_URL, adminKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    console.log('[CAMPUS AI] Supabase clients successfully initialized.');
  } catch (initErr) {
    console.error('[CAMPUS AI] Supabase client initialization error:', initErr.message);
  }
} else {
  console.log('[CAMPUS AI] Notice: Supabase environment variables not fully set. Running in dual-compatibility mode with local storage/persistence fallback.');
}

/**
 * Creates an authenticated Supabase client on behalf of a specific user token
 * @param {string} accessToken - User's JWT token
 * @returns {object} Supabase client scoped to user
 */
function createUserClient(accessToken) {
  if (!isSupabaseConfigured || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Helper to sanitize database errors before returning to client
 * Prevents leaks of internal SQL, schema structure, or credentials
 * @param {Error|object} err 
 * @returns {string} Safe user-facing error message
 */
function sanitizeDbError(err) {
  if (!err) return 'An unexpected error occurred.';
  const rawMsg = err.message || (typeof err === 'string' ? err : '');
  
  if (rawMsg.includes('violates foreign key constraint')) {
    return 'Referenced record was not found or has dependent relations.';
  }
  if (rawMsg.includes('duplicate key value') || rawMsg.includes('unique constraint')) {
    return 'A record with this identifier already exists.';
  }
  if (rawMsg.includes('row-level security') || rawMsg.includes('RLS')) {
    return 'Access denied by row-level security policy.';
  }
  if (rawMsg.includes('invalid input syntax for type uuid')) {
    return 'Invalid identifier format provided.';
  }
  if (rawMsg.includes('JWT') || rawMsg.includes('token')) {
    return 'Authentication session is invalid or has expired.';
  }
  return 'The requested operation could not be completed at this time.';
}

/**
 * Test connectivity with Supabase PostgreSQL
 */
async function testConnection() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { ok: false, message: 'Supabase URL or keys not configured' };
  }
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { ok: false, error: error.message };
    }
    return { ok: true, message: 'Supabase PostgreSQL connection operational' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Initialize core Supabase Storage buckets if not present
 */
const REQUIRED_STORAGE_BUCKETS = [
  { id: 'avatars', public: true },
  { id: 'issue-attachments', public: true },
  { id: 'resolution-proofs', public: true },
  { id: 'learning-resources', public: true },
  { id: 'reports', public: false }
];

async function ensureStorageBuckets() {
  if (!isSupabaseConfigured || !supabaseAdmin) return;
  try {
    const { data: existingBuckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.warn('[CAMPUS AI] Storage list buckets note:', error.message);
      return;
    }
    const existingNames = new Set((existingBuckets || []).map(b => b.name));
    for (const b of REQUIRED_STORAGE_BUCKETS) {
      if (!existingNames.has(b.id)) {
        await supabaseAdmin.storage.createBucket(b.id, { public: b.public });
        console.log(`[CAMPUS AI] Created Supabase Storage bucket: ${b.id}`);
      }
    }
  } catch (err) {
    console.warn('[CAMPUS AI] Storage bucket verification note:', err.message);
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  createUserClient,
  sanitizeDbError,
  testConnection,
  ensureStorageBuckets,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};
