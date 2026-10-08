const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', requireAuth, feeController.getFees);
router.post('/', requireAuth, requireRole(['admin']), feeController.createFee);
router.post('/:id/pay', requireAuth, feeController.payFee);
router.post('/:id/edit', requireAuth, requireRole(['admin']), feeController.updateFee);
router.post('/:id/delete', requireAuth, requireRole(['admin']), feeController.deleteFee);
router.get('/:id/receipt', requireAuth, feeController.getReceipt);
router.post('/:id/reminder', requireAuth, requireRole(['admin']), feeController.sendReminder);
router.post('/bulk-upload', requireAuth, requireRole(['admin']), upload.single('file'), feeController.bulkUploadFees);
router.post('/bulk-delete', requireAuth, requireRole(['admin']), feeController.bulkDeleteFees);

module.exports = router;
