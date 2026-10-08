const campusMapService = require('../services/campusMapService');
const { Resource, CampusProblem } = require('../models');

// --------------------------------------------------------------------------
// WEB UI CONTROLLER
// --------------------------------------------------------------------------

exports.getMapView = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : 'admin';
    const bundle = await campusMapService.getCampusMapBundle(userRole);

    res.render('campus/map', {
      pageTitle: 'Intelligent Campus Map — CAMPUS AI',
      bundle,
      userRole,
      currentUser: req.user || null
    });
  } catch (error) {
    console.error('[CampusMapController Error]:', error);
    res.status(500).render('errors/500', {
      pageTitle: 'Campus Map Error',
      message: 'Failed to load Intelligent Campus Map module.'
    });
  }
};

// --------------------------------------------------------------------------
// REST APIS
// --------------------------------------------------------------------------

exports.apiGetMapBundle = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : (req.query.role || 'admin');
    const bundle = await campusMapService.getCampusMapBundle(userRole);
    res.json({ success: true, data: bundle });
  } catch (error) {
    console.error('[apiGetMapBundle Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetBuildings = async (req, res) => {
  try {
    const userRole = req.user ? req.user.role : 'admin';
    const buildings = campusMapService.filterByRole(campusMapService.masterBuildings, userRole);
    res.json({ success: true, count: buildings.length, data: buildings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const building = campusMapService.masterBuildings.find(b => b.id === id || b.code === id);
    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }
    const insight = campusMapService.generateBuildingAIInsight(building.id);
    res.json({ success: true, data: { ...building, aiInsight: insight } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetResources = async (req, res) => {
  try {
    const dbResources = await Resource.findAll({ order: [['timeUtilization', 'DESC']] });
    const geoResources = campusMapService.mapResourcesToCoordinates(dbResources);
    res.json({ success: true, count: geoResources.length, data: geoResources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetIssues = async (req, res) => {
  try {
    const dbProblems = await CampusProblem.findAll({
      where: { status: ['Open', 'In Progress', 'Escalated'] }
    });
    const geoIssues = campusMapService.mapProblemsToCoordinates(dbProblems);
    res.json({ success: true, count: geoIssues.length, data: geoIssues });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetHotspots = async (req, res) => {
  try {
    const bundle = await campusMapService.getCampusMapBundle(req.user?.role || 'admin');
    res.json({ success: true, count: bundle.hotspots.length, data: bundle.hotspots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetUtilization = async (req, res) => {
  try {
    const bundle = await campusMapService.getCampusMapBundle(req.user?.role || 'admin');
    const utilizationData = bundle.buildings.map(b => ({
      buildingId: b.id,
      name: b.name,
      timeUtilization: b.timeUtilization,
      capacity: b.capacity,
      currentOccupancy: b.currentOccupancy,
      status: b.operationalStatus
    }));
    res.json({ success: true, data: utilizationData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetCampusHealth = async (req, res) => {
  try {
    const health = campusMapService.calculateCampusHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiGetLayers = async (req, res) => {
  try {
    res.json({ success: true, data: campusMapService.layers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiPostCampusInsight = async (req, res) => {
  try {
    const { buildingId } = req.body;
    const insight = campusMapService.generateBuildingAIInsight(buildingId || 'BLD-B');
    res.json({ success: true, data: insight });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.apiPostSimulation = async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const result = campusMapService.simulateScenario(scenarioId || 'block_b_outage');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
