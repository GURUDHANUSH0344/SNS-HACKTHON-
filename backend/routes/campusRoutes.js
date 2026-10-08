const express = require('express');
const router = express.Router();
const campusMapController = require('../controllers/campusMapController');
const { requireAuth } = require('../middleware/authMiddleware');

// Web UI: /campus/map and /campus
router.get('/map', requireAuth, campusMapController.getMapView);
router.get('/', requireAuth, (req, res) => res.redirect('/campus/map'));

module.exports = router;
