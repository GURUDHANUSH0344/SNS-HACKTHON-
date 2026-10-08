const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admissions
router.get('/', requireAuth, requireRole(['admin']), admissionController.getAdmissions);
router.post('/', requireAuth, requireRole(['admin']), upload.single('document'), admissionController.createAdmission);
router.post('/:id/approve', requireAuth, requireRole(['admin']), admissionController.approveAdmission);
router.post('/:id/reject', requireAuth, requireRole(['admin']), admissionController.rejectAdmission);
router.post('/:id/delete', requireAuth, requireRole(['admin']), admissionController.deleteAdmission);
router.post('/bulk-upload', requireAuth, requireRole(['admin']), upload.single('file'), admissionController.bulkUploadAdmissions);

// Student Management (Under /admissions/students as specified in Section 12)
router.get('/students', requireAuth, requireRole(['admin', 'teacher']), admissionController.getStudents);
router.post('/students', requireAuth, requireRole(['admin']), admissionController.createStudent);
router.post('/students/:id/edit', requireAuth, requireRole(['admin']), admissionController.updateStudent);
router.post('/students/:id/delete', requireAuth, requireRole(['admin']), admissionController.deleteStudent);
router.post('/students/bulk-upload', requireAuth, requireRole(['admin']), upload.single('file'), admissionController.bulkUploadStudents);
router.post('/students/bulk-delete', requireAuth, requireRole(['admin']), admissionController.bulkDeleteStudents);

module.exports = router;
