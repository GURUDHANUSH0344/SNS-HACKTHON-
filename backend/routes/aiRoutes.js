const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Assistant
router.get('/assistant', requireAuth, aiController.getAssistant);
router.post('/chat', requireAuth, aiController.postChat);

// Academic Prediction & Early Warning
router.get('/performance-prediction', requireAuth, aiController.getPerformancePrediction);
router.get('/early-warning', requireAuth, requireRole(['admin', 'teacher']), aiController.getEarlyWarning);

// Learning Path
router.get('/learning-path', requireAuth, aiController.getLearningPath);
router.post('/learning-path/generate', requireAuth, aiController.generateLearningPath);
router.post('/learning-path/:id/toggle-day', requireAuth, aiController.toggleDayProgress);

// Quiz
router.get('/quiz', requireAuth, aiController.getQuiz);
router.post('/quiz/generate', requireAuth, aiController.generateQuiz);
router.post('/quiz/submit', requireAuth, aiController.submitQuiz);

// Attendance Intelligence
router.get('/attendance-intelligence', requireAuth, aiController.getAttendanceIntelligence);

// Profile & Career & Gamification
router.get('/profile', requireAuth, aiController.getDigitalProfile);
router.get('/career', requireAuth, aiController.getCareerNavigator);
router.get('/gamification', requireAuth, aiController.getGamification);

// Campus Directory
router.get('/campus-info', requireAuth, aiController.getCampusInfo);
router.get('/campus-info/search', requireAuth, aiController.searchCampusInfo);

// Admin Analytics & Reports
router.get('/admin-analytics', requireAuth, requireRole(['admin']), aiController.getAdminAnalytics);
router.get('/reports', requireAuth, requireRole(['admin']), aiController.getReports);
router.post('/reports/generate', requireAuth, requireRole(['admin']), aiController.generateReport);
router.get('/reports/:id/pdf', requireAuth, requireRole(['admin']), aiController.downloadReportPDF);

// Notifications
router.get('/notifications', requireAuth, aiController.getNotifications);
router.post('/notifications/:id/read', requireAuth, aiController.markNotificationRead);

// CampusAI Operations & Intelligence Hub
router.get('/operations-hub', requireAuth, aiController.getHackathonDemo);
router.get('/hub', requireAuth, (req, res) => res.redirect('/ai/operations-hub'));
router.get('/hackathon-demo', requireAuth, aiController.getHackathonDemo);

// AI Code Lab
const codeLabController = require('../controllers/codeLabController');
router.get('/code-lab', requireAuth, codeLabController.renderCodeLab);

module.exports = router;
