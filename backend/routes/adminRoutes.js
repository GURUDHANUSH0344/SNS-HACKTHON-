const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/dashboard', requireAuth, requireRole(['admin']), adminController.getDashboard);
router.get('/approvals', requireAuth, requireRole(['admin']), adminController.getApprovals);
router.post('/approvals/:id/approve', requireAuth, requireRole(['admin']), adminController.approveUser);
router.post('/approvals/:id/reject', requireAuth, requireRole(['admin']), adminController.rejectUser);

module.exports = router;
