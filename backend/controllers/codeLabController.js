/**
 * CAMPUS AI — AI Code Lab Controller
 * 
 * Manages cloud-synced coding sessions, server-side sandboxed executions,
 * automated test verification, and AI code intelligence.
 */

const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const codeExecutionService = require('../services/codeExecutionService');
const codeAnalysisService = require('../services/codeAnalysisService');
const codeTestService = require('../services/codeTestService');
const aiService = require('../services/aiService');

// In-memory fallback session store for local/offline developer mode
const localSessionsStore = new Map();

/**
 * Render the full interactive AI Code Lab UI
 */
exports.renderCodeLab = async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    let userSessions = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('code_sessions')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(10);
        if (!error && data) userSessions = data;
      } catch (e) {
        // Fallback
      }
    }

    if (userSessions.length === 0) {
      userSessions = Array.from(localSessionsStore.values()).filter(s => s.user_id === userId);
    }

    // Default starter template if none exist
    const defaultTemplate = `// Welcome to CampusAI Interactive Code Lab
// Language: JavaScript (Node.js Sandbox)

function findTwoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test Run
const numbers = [2, 7, 11, 15];
const targetVal = 9;
const indices = findTwoSum(numbers, targetVal);

console.log("Input Array:", numbers);
console.log("Target:", targetVal);
console.log("Solution Indices:", indices);
console.log("Values:", indices.map(idx => numbers[idx]));
`;

    res.render('ai/code_lab', {
      pageTitle: 'AI Code Lab — CampusAI Autonomous Learning Platform',
      user: req.user,
      sessions: userSessions,
      defaultTemplate,
      activeSession: userSessions[0] || null
    });
  } catch (err) {
    console.error('[Code Lab Error]:', err);
    res.status(500).render('errors/500', {
      pageTitle: 'Code Lab Error — CampusAI',
      message: 'Unable to initialize the Code Lab workspace.'
    });
  }
};

/**
 * List all code sessions for current user
 */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('code_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, sessions: data || [] });
    }

    // Fallback store
    const sessions = Array.from(localSessionsStore.values()).filter(s => s.user_id === userId);
    return res.json({ success: true, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get details for a single session
 */
exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: session, error } = await supabaseAdmin
        .from('code_sessions')
        .select('*, code_test_cases(*), code_executions(*)')
        .eq('id', id)
        .single();

      if (error || !session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }
      return res.json({ success: true, session });
    }

    const session = localSessionsStore.get(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    return res.json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new code session
 */
exports.createSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title = 'New Algorithm', language = 'javascript', source_code = '' } = req.body;

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('code_sessions')
        .insert({
          user_id: userId,
          title: title.trim(),
          language: language.toLowerCase(),
          source_code: source_code
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, session: data });
    }

    // Fallback in-memory
    const newId = 'session_' + Date.now();
    const newSession = {
      id: newId,
      user_id: userId,
      title,
      language,
      source_code,
      execution_status: 'idle',
      created_at: new Date(),
      updated_at: new Date()
    };
    localSessionsStore.set(newId, newSession);
    return res.status(201).json({ success: true, session: newSession });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update code session
 */
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, language, source_code, stdin } = req.body;

    if (isSupabaseConfigured && supabaseAdmin) {
      const updatePayload = { updated_at: new Date() };
      if (title !== undefined) updatePayload.title = title;
      if (language !== undefined) updatePayload.language = language;
      if (source_code !== undefined) updatePayload.source_code = source_code;
      if (stdin !== undefined) updatePayload.stdin = stdin;

      const { data, error } = await supabaseAdmin
        .from('code_sessions')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, session: data });
    }

    const session = localSessionsStore.get(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (title !== undefined) session.title = title;
    if (language !== undefined) session.language = language;
    if (source_code !== undefined) session.source_code = source_code;
    if (stdin !== undefined) session.stdin = stdin;
    session.updated_at = new Date();

    return res.json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete session
 */
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('code_sessions').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Session deleted successfully.' });
    }

    localSessionsStore.delete(id);
    return res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Execute code snippet
 */
exports.executeCode = async (req, res) => {
  try {
    const { sourceCode, language = 'javascript', stdin = '', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode && sourceCode !== '') {
      return res.status(400).json({ success: false, error: 'Source code is required.' });
    }

    const result = await codeExecutionService.runCode(sourceCode, language, stdin, sessionId, userId);
    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Execute automated test suites
 */
exports.runTests = async (req, res) => {
  try {
    const { sourceCode, language = 'javascript', testCases = [], sessionId = null } = req.body;

    const result = await codeTestService.runTestSuite(sourceCode, language, testCases, sessionId);
    return res.json({
      success: true,
      testResults: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Perform AI analysis on code (explain, optimize, debug, complexity)
 */
exports.analyzeCode = async (req, res) => {
  try {
    const { sourceCode, language = 'javascript', analysisType = 'explain', promptContext = '', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode) {
      return res.status(400).json({ success: false, error: 'Source code is required for AI analysis.' });
    }

    const analysis = await codeAnalysisService.analyzeCode(sourceCode, language, analysisType, promptContext, sessionId, userId);
    return res.json({
      success: true,
      analysis
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Search & synthesize algorithmic code snippet using AI
 */
exports.searchCode = async (req, res) => {
  try {
    const { query, language = 'python', difficulty = 'intermediate' } = req.body;
    const userId = req.user?.id || null;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required.' });
    }

    const prompt = `Write a clean, production-grade, well-commented implementation in ${language} for the following requirement: "${query}". Include time and space complexity notes at the top:`;
    let generatedCode = '';

    try {
      generatedCode = await aiService.generateChatResponse(prompt, { role: 'student', name: 'Code Lab' });
    } catch (e) {
      generatedCode = `// Generated Code for: ${query}\n// Language: ${language}\n\nfunction solution() {\n  // Implementation\n  return true;\n}\n`;
    }

    // Persist into Supabase search history
    if (isSupabaseConfigured && supabaseAdmin && userId) {
      try {
        await supabaseAdmin.from('code_search_history').insert({
          user_id: userId,
          query,
          language,
          difficulty,
          generated_code: generatedCode
        });
      } catch (err) {
        // Continue
      }
    }

    return res.json({
      success: true,
      query,
      language,
      code: generatedCode
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
