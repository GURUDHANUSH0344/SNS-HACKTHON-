const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceOptimizationController');
const { requireAuth } = require('../middleware/authMiddleware');

// Master Specification APIs for Smart Resource Optimization Engine
router.get('/utilization', resourceController.apiGetUtilization);
router.get('/underutilized', resourceController.apiGetUnderutilized);
router.get('/overloaded', resourceController.apiGetOverloaded);
router.get('/availability', resourceController.apiGetAvailability);
router.get('/conflicts', resourceController.apiGetConflicts);
router.get('/demand', resourceController.apiGetDemand);
router.get('/recommendations', resourceController.apiGetRecommendations);
router.get('/analytics', resourceController.apiGetAnalytics);
router.get('/heatmap', resourceController.apiGetHeatmap);
router.get('/map', resourceController.apiGetMap);
router.get('/maintenance', resourceController.apiGetMaintenance);

router.post('/allocate', resourceController.apiPostAllocate);
router.post('/simulate', resourceController.apiPostSimulate);
router.post('/optimize', resourceController.apiPostOptimize);
router.post('/reset-demo', resourceController.apiPostResetDemo);

router.get('/:id', resourceController.apiGetResourceById);
router.get('/', resourceController.apiGetResources);

module.exports = router;
