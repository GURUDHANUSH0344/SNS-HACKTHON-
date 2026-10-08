/**
 * CAMPUS AI — AI Code Lab Routes
 */

const express = require('express');
const router = express.Router();
const codeLabController = require('../controllers/codeLabController');
const { requireAuth } = require('../middleware/supabaseAuthMiddleware');

// Web View Route
router.get('/', requireAuth, codeLabController.renderCodeLab);

// API Routes for Cloud-Synced Code Lab Operations
router.get('/sessions', requireAuth, codeLabController.getSessions);
router.post('/sessions', requireAuth, codeLabController.createSession);
router.get('/sessions/:id', requireAuth, codeLabController.getSession);
router.put('/sessions/:id', requireAuth, codeLabController.updateSession);
router.delete('/sessions/:id', requireAuth, codeLabController.deleteSession);

router.post('/execute', requireAuth, codeLabController.executeCode);
router.post('/test', requireAuth, codeLabController.runTests);
router.post('/analyze', requireAuth, codeLabController.analyzeCode);
router.post('/search', requireAuth, codeLabController.searchCode);

module.exports = router;
