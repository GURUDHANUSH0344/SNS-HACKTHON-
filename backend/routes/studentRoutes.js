const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/dashboard', requireAuth, studentController.getDashboard);
router.get('/profile', requireAuth, studentController.getProfile);
router.get('/export', requireAuth, studentController.exportProfile);
router.get('/results', requireAuth, studentController.getResults);
router.get('/attendance', requireAuth, studentController.getAttendance);
router.get('/fees', requireAuth, studentController.getFees);
router.get('/hostel', requireAuth, studentController.getHostel);
router.get('/assignments', requireAuth, studentController.getAssignments);
router.post('/assignments/:id/submit', requireAuth, upload.single('attachment'), studentController.submitAssignment);

module.exports = router;
