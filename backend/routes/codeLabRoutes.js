/**
 * CAMPUS AI — AI Code Lab & Search Generator Routes
 */

const express = require('express');
const router = express.Router();
const codeLabController = require('../controllers/codeLabController');
const { requireAuth } = require('../middleware/supabaseAuthMiddleware');

// Web Page
router.get('/', requireAuth, codeLabController.renderCodeLab);

// AI Code Search & Generator
router.post('/generate', requireAuth, codeLabController.generateCode);

// Code Execution & Testing
router.post('/run', requireAuth, codeLabController.runCode);
router.post('/execute', requireAuth, codeLabController.runCode); // Alias
router.post('/test', requireAuth, codeLabController.runTests);

// AI Coding Assistant Capabilities
router.post('/explain', requireAuth, codeLabController.explainCode);
router.post('/debug', requireAuth, codeLabController.debugCode);
router.post('/optimize', requireAuth, codeLabController.optimizeCode);
router.post('/analyze', requireAuth, codeLabController.analyzeCode); // Universal analysis alias
router.post('/tests/generate', requireAuth, codeLabController.generateTests);
router.post('/hint', requireAuth, codeLabController.generateHints);
router.post('/convert', requireAuth, codeLabController.convertCode);

// Sessions & History
router.get('/sessions', requireAuth, codeLabController.getSessions);
router.post('/sessions', requireAuth, codeLabController.createSession);
router.get('/sessions/:id', requireAuth, codeLabController.getSession);
router.put('/sessions/:id', requireAuth, codeLabController.updateSession);
router.delete('/sessions/:id', requireAuth, codeLabController.deleteSession);

// Download
router.get('/download', requireAuth, codeLabController.downloadCode);

module.exports = router;
