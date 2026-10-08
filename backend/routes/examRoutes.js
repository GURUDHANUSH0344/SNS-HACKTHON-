const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', requireAuth, examController.getExams);
router.post('/', requireAuth, requireRole(['admin', 'teacher']), examController.createExam);
router.post('/:id/edit', requireAuth, requireRole(['admin', 'teacher']), examController.updateExam);
router.post('/:id/delete', requireAuth, requireRole(['admin', 'teacher']), examController.deleteExam);
router.post('/bulk-upload', requireAuth, requireRole(['admin', 'teacher']), upload.single('file'), examController.bulkUploadExams);

module.exports = router;
