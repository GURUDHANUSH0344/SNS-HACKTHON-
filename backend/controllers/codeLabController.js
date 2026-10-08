/**
 * CAMPUS AI — AI Code Lab Controller
 * 
 * Thin controller dispatching to codeExecutionService, codeAnalysisService,
 * and codeTestService, managing cloud-persisted sessions and search history.
 */

const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const { CodeSession, CodeExecution, CodeTestCase, CodeSearchHistory } = require('../models');
const codeExecutionService = require('../services/codeExecutionService');
const codeAnalysisService = require('../services/codeAnalysisService');
const codeTestService = require('../services/codeTestService');

// In-memory fallback session store for local/offline developer mode
const localSessionsStore = new Map();

/**
 * 1. Render Code Lab View
 */
exports.renderCodeLab = async (req, res) => {
  try {
    const userId = req.user?.id ? String(req.user.id) : 'demo-user';
    let userSessions = [];
    let recentSearches = [];

    // 1. Try Sequelize Database Store
    if (CodeSession && req.user?.id) {
      try {
        userSessions = await CodeSession.findAll({
          where: { userId },
          order: [['updated_at', 'DESC']],
          limit: 10
        });
      } catch (e) {}
    }

    if (CodeSearchHistory && req.user?.id) {
      try {
        recentSearches = await CodeSearchHistory.findAll({
          where: { userId },
          order: [['created_at', 'DESC']],
          limit: 6
        });
      } catch (e) {}
    }

    // 2. Fallback to Supabase if UUID user
    if (userSessions.length === 0 && isSupabaseConfigured && supabaseAdmin && typeof req.user?.id === 'string' && req.user.id.includes('-')) {
      try {
        const { data: sData } = await supabaseAdmin
          .from('code_sessions')
          .select('*')
          .eq('user_id', req.user.id)
          .order('updated_at', { ascending: false })
          .limit(10);
        if (sData) userSessions = sData;
      } catch (e) {}
    }

    // 3. Fallback to Local Memory Store
    if (userSessions.length === 0) {
      userSessions = Array.from(localSessionsStore.values()).filter(s => s.user_id === userId);
    }

    // Default starter templates
    const starterTemplates = {
      python: `# Python 3 Starter\n# Write, Run, Learn, Improve.\n\nn = int(input())\nprint(f"Square of {n} is: {n * n}")\n`,
      c: `#include <stdio.h>\n\nint main() {\n    printf("Hello from CampusAI C Sandbox!\\n");\n    return 0;\n}\n`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from CampusAI C++ Sandbox!" << endl;\n    return 0;\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from CampusAI Java Sandbox!");\n    }\n}\n`,
      javascript: `// JavaScript Sandbox (Node.js VM)\n\nfunction findTwoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconst nums = [2, 7, 11, 15];\nconsole.log("Two Sum indices:", findTwoSum(nums, 9));\n`
    };

    res.render('ai/code_lab', {
      pageTitle: 'AI Code Lab — CampusAI Autonomous Learning Platform',
      user: req.user,
      sessions: userSessions,
      recentSearches,
      starterTemplates,
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
 * 2. Natural Language AI Code Generation
 */
exports.generateCode = async (req, res) => {
  try {
    const { query, language = 'python', difficulty = 'beginner', mode = 'learn' } = req.body;
    const userId = req.user?.id || null;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a programming question or algorithm prompt.' });
    }

    const result = await codeAnalysisService.generateCodeFromPrompt({
      query: query.trim(),
      language,
      difficulty,
      mode,
      userId
    });

    return res.json(result);
  } catch (err) {
    console.error('[Code Generator Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate code.' });
  }
};

/**
 * 3. Run Code
 */
exports.runCode = async (req, res) => {
  try {
    const { sourceCode, language = 'python', stdin = '', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode && sourceCode !== '') {
      return res.status(400).json({ success: false, error: 'Source code is required.' });
    }

    const result = await codeExecutionService.executeCode(sourceCode, language, stdin, sessionId, userId);
    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[Run Code Error]:', err);
    return res.status(500).json({ success: false, error: 'Internal execution error.' });
  }
};

/**
 * 4. Run Test Cases
 */
exports.runTests = async (req, res) => {
  try {
    const { sourceCode, language = 'python', testCases = [], sessionId = null } = req.body;

    const result = await codeTestService.runTestSuite(sourceCode, language, testCases, sessionId);
    return res.json({
      success: true,
      testResults: result
    });
  } catch (err) {
    console.error('[Run Tests Error]:', err);
    return res.status(500).json({ success: false, error: 'Test execution failed.' });
  }
};

/**
 * 5. Explain Code
 */
exports.explainCode = async (req, res) => {
  try {
    const { sourceCode, language = 'python', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode) return res.status(400).json({ success: false, error: 'Source code required.' });

    const result = await codeAnalysisService.explainCode({ sourceCode, language, sessionId, userId });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Explanation failed.' });
  }
};

/**
 * 6. Debug with AI
 */
exports.debugCode = async (req, res) => {
  try {
    const { sourceCode, language = 'python', stdin = '', errorOutput = '', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode) return res.status(400).json({ success: false, error: 'Source code required.' });

    const result = await codeAnalysisService.debugCode({ sourceCode, language, stdin, errorOutput, sessionId, userId });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Debugging failed.' });
  }
};

/**
 * 7. Optimize Code
 */
exports.optimizeCode = async (req, res) => {
  try {
    const { sourceCode, language = 'python', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode) return res.status(400).json({ success: false, error: 'Source code required.' });

    const result = await codeAnalysisService.optimizeCode({ sourceCode, language, sessionId, userId });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Optimization failed.' });
  }
};

/**
 * 8. Generate Test Cases
 */
exports.generateTests = async (req, res) => {
  try {
    const { sourceCode, language = 'python', sessionId = null } = req.body;
    const userId = req.user?.id || null;

    if (!sourceCode) return res.status(400).json({ success: false, error: 'Source code required.' });

    const result = await codeAnalysisService.generateTestCases({ sourceCode, language, sessionId, userId });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Test generation failed.' });
  }
};

/**
 * 9. Progressive Hints
 */
exports.generateHints = async (req, res) => {
  try {
    const { sourceCode, language = 'python', level = 1 } = req.body;
    const result = await codeAnalysisService.generateHints({ sourceCode, language, level: parseInt(level, 10) || 1 });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Hint generation failed.' });
  }
};

/**
 * 10. Convert Code
 */
exports.convertCode = async (req, res) => {
  try {
    const { sourceCode, sourceLanguage, targetLanguage } = req.body;
    if (!sourceCode || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ success: false, error: 'Source code and languages are required.' });
    }

    const result = await codeAnalysisService.convertLanguage({ sourceCode, sourceLanguage, targetLanguage });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Language conversion failed.' });
  }
};

/**
 * Legacy / Generic Code Analysis Dispatcher
 */
exports.analyzeCode = async (req, res) => {
  const { analysisType } = req.body;
  if (analysisType === 'explain') return exports.explainCode(req, res);
  if (analysisType === 'debug') return exports.debugCode(req, res);
  return exports.optimizeCode(req, res);
};

/**
 * 11. Coding Sessions CRUD
 */
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (CodeSession && userId) {
      try {
        const sessions = await CodeSession.findAll({
          where: { userId },
          order: [['updated_at', 'DESC']],
          limit: 20
        });
        return res.json({ success: true, sessions });
      } catch (dbErr) {}
    }

    const sessions = Array.from(localSessionsStore.values()).filter(s => s.user_id === userId);
    return res.json({ success: true, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (CodeSession) {
      try {
        const session = await CodeSession.findByPk(id);
        if (session) return res.json({ success: true, session });
      } catch (dbErr) {}
    }

    const session = localSessionsStore.get(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    return res.json({ success: true, session });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    const { title = 'Untitled Algorithm', language = 'python', source_code = '', stdin = '' } = req.body;

    if (CodeSession && userId) {
      try {
        const session = await CodeSession.create({
          userId,
          title: title.trim(),
          language: language.toLowerCase(),
          sourceCode: source_code,
          stdin
        });
        return res.status(201).json({ success: true, session });
      } catch (dbErr) {}
    }

    const newId = 'session_' + Date.now();
    const newSession = {
      id: newId,
      user_id: userId,
      title: title.trim(),
      language: language.toLowerCase(),
      source_code,
      stdin,
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

exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, language, source_code, stdin } = req.body;

    if (CodeSession) {
      try {
        const session = await CodeSession.findByPk(id);
        if (session) {
          if (title !== undefined) session.title = title;
          if (language !== undefined) session.language = language;
          if (source_code !== undefined) session.sourceCode = source_code;
          if (stdin !== undefined) session.stdin = stdin;
          await session.save();
          return res.json({ success: true, session });
        }
      } catch (dbErr) {}
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

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (CodeSession) {
      try {
        await CodeSession.destroy({ where: { id } });
      } catch (dbErr) {}
    }
    localSessionsStore.delete(id);
    return res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 12. Safe File Download
 */
exports.downloadCode = (req, res) => {
  try {
    const { sourceCode = '', language = 'python', filename = 'solution' } = req.query;

    const extensionMap = {
      python: '.py',
      c: '.c',
      cpp: '.cpp',
      java: '.java',
      javascript: '.js',
      typescript: '.ts',
      sql: '.sql',
      html: '.html',
      css: '.css'
    };

    const ext = extensionMap[(language || '').toLowerCase()] || '.txt';
    const safeName = (filename || 'solution').replace(/[^a-zA-Z0-9_-]/g, '_') + ext;

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(sourceCode);
  } catch (err) {
    res.status(500).send('Download failed.');
  }
};
