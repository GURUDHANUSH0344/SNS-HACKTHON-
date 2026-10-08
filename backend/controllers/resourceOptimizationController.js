const {
  Resource,
  ResourceBooking,
  ResourceUsage,
  ResourceMaintenance,
  ResourceRecommendation,
  ResourceAllocationLog,
  ResourceSimulation,
  Department
} = require('../models');
const resourceOptimizationService = require('../services/resourceOptimizationService');

// -------------------------------------------------------------
// WEB UI CONTROLLER METHODS
// -------------------------------------------------------------

exports.getDashboard = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      order: [['timeUtilization', 'DESC']]
    });

    const efficiencyData = await resourceOptimizationService.calculateEfficiencyMetrics();
    const demandData = resourceOptimizationService.getDemandPredictionData();
    const heatmapData = await resourceOptimizationService.getUtilizationHeatmap();
    const buildingMapData = await resourceOptimizationService.getBuildingMapOverview();

    // AI Recommendations
    const recommendations = await ResourceRecommendation.findAll({
      where: { status: 'pending' },
      include: [
        { model: Resource, as: 'resource' }
      ],
      order: [['confidence', 'DESC']]
    });

    // Recent Audit Logs
    const auditLogs = await ResourceAllocationLog.findAll({
      include: [
        { model: Resource, as: 'resource' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Scheduled Maintenance
    const maintenance = await ResourceMaintenance.findAll({
      include: [{ model: Resource, as: 'resource' }],
      order: [['startDate', 'ASC']],
      limit: 5
    });

    // Top Underutilized (<= 30%)
    const underutilized = resources.filter(r => r.timeUtilization <= 30);

    // Top Overloaded (>= 90%)
    const overloaded = resources.filter(r => r.timeUtilization >= 90);

    // Target demo resources
    const lab1 = resources.find(r => r.code === 'LAB-B3-01') || resources[0];
    const lab3 = resources.find(r => r.code === 'LAB-B3-02') || resources[1];

    res.render('ai/resources/index', {
      pageTitle: 'Smart Resource Optimization — CAMPUS AI',
      resources,
      underutilized,
      overloaded,
      efficiencyData,
      demandData,
      heatmapData,
      buildingMapData,
      recommendations,
      auditLogs,
      maintenance,
      lab1,
      lab3,
      user: req.user
    });
  } catch (err) {
    console.error('[Resource Optimization Dashboard Error]:', err);
    res.status(500).render('errors/500', {
      pageTitle: 'Error',
      message: 'Failed to load Smart Resource Optimization module.'
    });
  }
};

exports.getResourceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findOne({
      where: isNaN(id) ? { code: id } : { id },
      include: [
        { model: ResourceBooking, as: 'bookings' },
        { model: ResourceMaintenance, as: 'maintenanceRecords' },
        { model: ResourceRecommendation, as: 'recommendations' }
      ]
    });

    if (!resource) {
      return res.status(404).render('errors/404', {
        pageTitle: 'Resource Not Found',
        message: 'The requested campus resource does not exist in the master inventory.'
      });
    }

    const equipmentList = typeof resource.equipmentSpecs === 'string'
      ? JSON.parse(resource.equipmentSpecs || '[]')
      : (resource.equipmentSpecs || []);

    res.render('ai/resources/detail', {
      pageTitle: `${resource.name} — Resource Profile & Optimization`,
      resource,
      equipmentList,
      user: req.user
    });
  } catch (err) {
    console.error('[Resource Detail Error]:', err);
    res.status(500).render('errors/500', {
      pageTitle: 'Error',
      message: 'Failed to load resource details.'
    });
  }
};

// -------------------------------------------------------------
// REST API ENDPOINTS (/api/resources/*)
// -------------------------------------------------------------

exports.apiGetResources = async (req, res) => {
  try {
    const { category, building, status, department } = req.query;
    const where = {};
    if (category) where.category = category;
    if (building) where.building = building;
    if (status) where.status = status;
    if (department) where.department = department;

    const resources = await Resource.findAll({ where });
    res.json({ success: true, count: resources.length, resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findOne({
      where: isNaN(id) ? { code: id } : { id },
      include: [
        { model: ResourceBooking, as: 'bookings' },
        { model: ResourceMaintenance, as: 'maintenanceRecords' }
      ]
    });
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetUtilization = async (req, res) => {
  try {
    const resources = await Resource.findAll();
    const utilizationSummary = resources.map(r => ({
      code: r.code,
      name: r.name,
      type: r.type,
      timeUtilization: r.timeUtilization,
      capacityUtilization: r.capacityUtilization,
      status: r.utilizationStatus,
      weeklyUnusedHours: r.weeklyUnusedHours
    }));
    res.json({ success: true, count: resources.length, utilization: utilizationSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetUnderutilized = async (req, res) => {
  try {
    const resources = await Resource.findAll();
    const underutilized = resources.filter(r => r.timeUtilization <= 30);
    res.json({
      success: true,
      count: underutilized.length,
      threshold: '<= 30%',
      resources: underutilized
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetOverloaded = async (req, res) => {
  try {
    const resources = await Resource.findAll();
    const overloaded = resources.filter(r => r.timeUtilization >= 90);
    res.json({
      success: true,
      count: overloaded.length,
      threshold: '>= 90%',
      resources: overloaded
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetAvailability = async (req, res) => {
  try {
    const { category, capacity, time } = req.query;
    const where = { status: 'Available', maintenanceStatus: 'Normal' };
    if (category) where.category = category;

    const available = await Resource.findAll({ where });
    res.json({ success: true, count: available.length, resources: available });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetConflicts = async (req, res) => {
  try {
    const { resourceId, dayOfWeek, startTime, endTime, capacity } = req.query;
    if (!resourceId) return res.status(400).json({ success: false, error: 'resourceId is required' });

    const result = await resourceOptimizationService.detectConflicts(
      resourceId,
      dayOfWeek || 'Wednesday',
      startTime || '14:00',
      endTime || '16:00',
      parseInt(capacity || 0)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetDemand = (req, res) => {
  try {
    const data = resourceOptimizationService.getDemandPredictionData();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetRecommendations = async (req, res) => {
  try {
    const recommendations = await ResourceRecommendation.findAll({
      include: [{ model: Resource, as: 'resource' }],
      order: [['confidence', 'DESC']]
    });
    res.json({ success: true, count: recommendations.length, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiPostSimulate = async (req, res) => {
  try {
    const { scenarioType, customParams } = req.body;
    const result = await resourceOptimizationService.simulateScenario(scenarioType || 'swap_lab1_to_lab3', customParams);
    res.json({ success: true, simulation: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiPostOptimize = async (req, res) => {
  try {
    const requestCriteria = req.body; // e.g. { expectedStudents: 55, department: 'Computer Science', requiredEquipment: ['Workstations'], ... }
    const resources = await Resource.findAll({
      where: { category: 'Academic Space' }
    });

    const evaluated = resources.map(resource => {
      const scoring = resourceOptimizationService.scoreResource(resource, requestCriteria);
      return {
        resource: {
          id: resource.id,
          code: resource.code,
          name: resource.name,
          capacity: resource.capacity,
          timeUtilization: resource.timeUtilization,
          department: resource.department,
          status: resource.status,
          building: resource.building
        },
        ...scoring
      };
    });

    evaluated.sort((a, b) => b.totalScore - a.totalScore);
    const bestMatch = evaluated[0] || null;

    res.json({
      success: true,
      bestMatch,
      allEvaluated: evaluated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiPostAllocate = async (req, res) => {
  try {
    const { recommendationId, reason } = req.body;
    const userEmail = req.user ? req.user.email : 'admin@campusai.edu';

    const result = await resourceOptimizationService.approveAllocation({
      recommendationId,
      reason,
      approvedBy: userEmail
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Allocate Approval Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetAnalytics = async (req, res) => {
  try {
    const metrics = await resourceOptimizationService.calculateEfficiencyMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetHeatmap = async (req, res) => {
  try {
    const heatmap = await resourceOptimizationService.getUtilizationHeatmap();
    res.json({ success: true, ...heatmap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetMap = async (req, res) => {
  try {
    const mapData = await resourceOptimizationService.getBuildingMapOverview();
    res.json({ success: true, buildings: mapData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiGetMaintenance = async (req, res) => {
  try {
    const maintenance = await ResourceMaintenance.findAll({
      include: [{ model: Resource, as: 'resource' }]
    });
    res.json({ success: true, count: maintenance.length, maintenance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.apiPostResetDemo = async (req, res) => {
  try {
    const lab1 = await Resource.findOne({ where: { code: 'LAB-B3-01' } });
    const lab3 = await Resource.findOne({ where: { code: 'LAB-B3-02' } });
    if (lab1 && lab3) {
      lab1.timeUtilization = 94.0;
      lab1.utilizationStatus = 'OVERLOADED';
      lab1.weeklyUsedHours = 37.6;
      lab1.weeklyUnusedHours = 2.4;
      await lab1.save();

      lab3.timeUtilization = 31.0;
      lab3.utilizationStatus = 'UNDERUTILIZED';
      lab3.weeklyUsedHours = 12.4;
      lab3.weeklyUnusedHours = 27.6;
      await lab3.save();

      const booking = await ResourceBooking.findOne({ where: { purpose: 'CS402 Python Programming Practical' } });
      if (booking) {
        booking.resourceId = lab1.id;
        booking.status = 'confirmed';
        await booking.save();
      }

      const rec = await ResourceRecommendation.findByPk(1);
      if (rec) {
        rec.status = 'pending';
        await rec.save();
      }
    }
    res.json({ success: true, message: 'Demo reset to baseline state (Lab 1 at 94%, Lab 3 at 31%).' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

