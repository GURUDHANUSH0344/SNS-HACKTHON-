const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/dashboard', requireAuth, requireRole(['teacher', 'admin']), facultyController.getDashboard);
router.get('/timetable', requireAuth, requireRole(['teacher', 'admin']), facultyController.getTimetable);
router.post('/timetable', requireAuth, requireRole(['teacher', 'admin']), facultyController.createTimetable);
router.post('/timetable/:id/delete', requireAuth, requireRole(['teacher', 'admin']), facultyController.deleteTimetable);

router.get('/attendance', requireAuth, requireRole(['teacher', 'admin']), facultyController.getAttendance);
router.post('/attendance', requireAuth, requireRole(['teacher', 'admin']), facultyController.submitAttendance);

router.get('/students', requireAuth, requireRole(['teacher', 'admin']), facultyController.getStudentsDirectory);

router.get('/assignments', requireAuth, requireRole(['teacher', 'admin']), facultyController.getAssignments);
router.post('/assignments', requireAuth, requireRole(['teacher', 'admin']), facultyController.createAssignment);
router.post('/assignments/:id/delete', requireAuth, requireRole(['teacher', 'admin']), facultyController.deleteAssignment);
router.post('/assignments/submissions/:id/grade', requireAuth, requireRole(['teacher', 'admin']), facultyController.gradeSubmission);

router.get('/exams', requireAuth, requireRole(['teacher', 'admin']), facultyController.getExams);

router.get('/ai-analytics', requireAuth, requireRole(['teacher', 'admin']), facultyController.getAIAnalytics);
router.get('/ai-assistant', requireAuth, requireRole(['teacher', 'admin']), facultyController.getAIAssistant);
router.post('/ai-assistant/chat', requireAuth, requireRole(['teacher', 'admin']), facultyController.chatAIAssistant);

router.get('/question-paper', requireAuth, requireRole(['teacher', 'admin']), facultyController.getQuestionPaper);
router.post('/question-paper/generate', requireAuth, requireRole(['teacher', 'admin']), facultyController.generateQuestionPaper);
router.post('/question-paper/save', requireAuth, requireRole(['teacher', 'admin']), facultyController.saveQuestionPaper);

router.get('/announcements', requireAuth, requireRole(['teacher', 'admin']), facultyController.getAnnouncements);
router.post('/announcements', requireAuth, requireRole(['teacher', 'admin']), facultyController.createAnnouncement);

router.get('/profile', requireAuth, requireRole(['teacher', 'admin']), facultyController.getProfile);
router.post('/profile', requireAuth, requireRole(['teacher', 'admin']), facultyController.updateProfile);

module.exports = router;
