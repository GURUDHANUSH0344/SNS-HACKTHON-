const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', requireAuth, hostelController.getHostel);
router.post('/allocate', requireAuth, requireRole(['admin']), hostelController.allocateRoom);
router.post('/add-room', requireAuth, requireRole(['admin']), hostelController.addRoom);
router.post('/:id/vacate', requireAuth, requireRole(['admin']), hostelController.vacateRoom);
router.post('/:id/delete', requireAuth, requireRole(['admin']), hostelController.deleteRoom);

module.exports = router;
