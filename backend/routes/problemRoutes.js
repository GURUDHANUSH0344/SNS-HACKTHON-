const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Helpdesk list & creation
router.get('/', requireAuth, problemController.getProblems);
router.get('/new', requireAuth, problemController.getNewProblem);
router.post('/new', requireAuth, upload.array('attachments', 5), problemController.createProblem);
router.post('/ai-classify', requireAuth, problemController.aiClassifyProblem);

// Analytics
router.get('/analytics', requireAuth, requireRole(['admin', 'teacher']), problemController.getAnalytics);

// Department Management
router.get('/departments', requireAuth, requireRole(['admin']), problemController.getDepartments);
router.post('/departments', requireAuth, requireRole(['admin']), problemController.createDepartment);
router.post('/departments/staff', requireAuth, requireRole(['admin']), problemController.addDepartmentStaff);

// Ticket Details & Workflow
router.get('/:id', requireAuth, problemController.getProblemDetail);
router.post('/:id/status', requireAuth, problemController.updateStatus);
router.post('/:id/assign', requireAuth, requireRole(['admin', 'teacher']), problemController.assignProblem);
router.post('/:id/comment', requireAuth, upload.single('attachment'), problemController.addComment);
router.post('/:id/resolve', requireAuth, upload.single('proof'), problemController.resolveProblem);
router.post('/:id/verify', requireAuth, problemController.verifyProblem);
router.post('/:id/escalate', requireAuth, problemController.escalateProblem);

module.exports = router;
