const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceOptimizationController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// ==========================================
// WEB UI ROUTES (/ai/resources or /resources)
// ==========================================
router.get('/', requireAuth, resourceController.getDashboard);
router.get('/detail/:id', requireAuth, resourceController.getResourceDetail);
router.get('/:id', requireAuth, (req, res, next) => {
  // If request accepts json or begins with api, next, else render detail
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return resourceController.apiGetResourceById(req, res);
  }
  return resourceController.getResourceDetail(req, res);
});

module.exports = router;
