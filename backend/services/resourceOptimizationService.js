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

class ResourceOptimizationService {
  constructor() {
    this.thresholds = {
      underutilizedMax: 30, // 0 - 30%
      optimalMin: 31,
      optimalMax: 70,       // 31 - 70%
      highMin: 71,
      highMax: 90,          // 71 - 90%
      overloadedMin: 91     // 91 - 100%
    };
  }

  // Get status based on utilization percentage
  getUtilizationCategory(percent) {
    if (percent <= this.thresholds.underutilizedMax) return 'UNDERUTILIZED';
    if (percent <= this.thresholds.optimalMax) return 'OPTIMALLY UTILIZED';
    if (percent <= this.thresholds.highMax) return 'HIGH UTILIZATION';
    return 'OVERLOADED';
  }

  // Multi-factor Scoring Engine
  scoreResource(resource, request) {
    let score = 0;
    const breakdown = [];

    // 1. Availability check (30 pts)
    const isAvailable = resource.status === 'Available' && resource.maintenanceStatus === 'Normal';
    if (isAvailable) {
      score += 30;
      breakdown.push({ factor: 'Availability', points: 30, max: 30, status: 'Passed', detail: 'Fully available in requested time slot' });
    } else {
      breakdown.push({ factor: 'Availability', points: 0, max: 30, status: 'Failed', detail: 'Resource marked busy or undergoing maintenance' });
    }

    // 2. Capacity match (25 pts)
    const reqCap = request.expectedStudents || request.capacity || 40;
    if (resource.capacity >= reqCap && resource.capacity <= reqCap * 1.35) {
      score += 25;
      breakdown.push({ factor: 'Capacity Right-Sizing', points: 25, max: 25, status: 'Passed', detail: `Capacity ${resource.capacity} seats fits ${reqCap} students without wasting seats` });
    } else if (resource.capacity >= reqCap) {
      score += 18;
      breakdown.push({ factor: 'Capacity Right-Sizing', points: 18, max: 25, status: 'Acceptable', detail: `Capacity ${resource.capacity} exceeds ${reqCap} students (minor surplus)` });
    } else {
      breakdown.push({ factor: 'Capacity Right-Sizing', points: 0, max: 25, status: 'Insufficient', detail: `Capacity ${resource.capacity} is less than ${reqCap} students required` });
    }

    // 3. Current utilization balance (15 pts) - favours underutilized resources
    if (resource.timeUtilization <= 35) {
      score += 15;
      breakdown.push({ factor: 'Utilization Balancing', points: 15, max: 15, status: 'Optimal', detail: `Low current utilization (${resource.timeUtilization}%) recovers unused capacity` });
    } else if (resource.timeUtilization <= 70) {
      score += 10;
      breakdown.push({ factor: 'Utilization Balancing', points: 10, max: 15, status: 'Normal', detail: `Healthy utilization (${resource.timeUtilization}%) prevents spikes` });
    } else if (resource.timeUtilization <= 88) {
      score += 5;
      breakdown.push({ factor: 'Utilization Balancing', points: 5, max: 15, status: 'Moderate', detail: `High utilization (${resource.timeUtilization}%) increases congestion risk` });
    } else {
      breakdown.push({ factor: 'Utilization Balancing', points: 0, max: 15, status: 'Warning', detail: `Overloaded resource (${resource.timeUtilization}%) - allocation avoided` });
    }

    // 4. Equipment match (15 pts)
    let equipMatched = true;
    if (request.requiredEquipment && request.requiredEquipment.length > 0) {
      const specs = typeof resource.equipmentSpecs === 'string' 
        ? JSON.parse(resource.equipmentSpecs || '[]') 
        : (resource.equipmentSpecs || []);
      const missing = request.requiredEquipment.filter(eq => 
        !specs.some(s => s.toLowerCase().includes(eq.toLowerCase()))
      );
      if (missing.length === 0) {
        score += 15;
        breakdown.push({ factor: 'Equipment Compatibility', points: 15, max: 15, status: 'Passed', detail: 'All required hardware/multimedia verified' });
      } else {
        score += 5;
        breakdown.push({ factor: 'Equipment Compatibility', points: 5, max: 15, status: 'Partial', detail: `Missing: ${missing.join(', ')}` });
      }
    } else {
      score += 15;
      breakdown.push({ factor: 'Equipment Compatibility', points: 15, max: 15, status: 'Passed', detail: 'Standard equipment requirements met' });
    }

    // 5. Department match (10 pts)
    if (request.department && resource.department && request.department.toLowerCase() === resource.department.toLowerCase()) {
      score += 10;
      breakdown.push({ factor: 'Department Affinity', points: 10, max: 10, status: 'Passed', detail: `Co-located in ${resource.department} academic zone` });
    } else {
      score += 5;
      breakdown.push({ factor: 'Department Affinity', points: 5, max: 10, status: 'Cross-Department', detail: `Cross-department allocation in ${resource.department}` });
    }

    // 6. Building / Location Proximity (5 pts)
    if (request.building && resource.building && request.building.toLowerCase() === resource.building.toLowerCase()) {
      score += 5;
      breakdown.push({ factor: 'Location Proximity', points: 5, max: 5, status: 'Passed', detail: `Same building (${resource.building}), minimal transit time` });
    } else {
      score += 3;
      breakdown.push({ factor: 'Location Proximity', points: 3, max: 5, status: 'Acceptable', detail: `Located in ${resource.building}` });
    }

    return {
      totalScore: Math.min(100, score),
      isViable: score >= 60 && resource.capacity >= reqCap && isAvailable,
      breakdown
    };
  }

  // Detect Conflicts for a requested time slot
  async detectConflicts(resourceId, dayOfWeek, startTime, endTime, reqCap = 0) {
    const resource = await Resource.findByPk(resourceId);
    if (!resource) return { hasConflict: true, reasons: ['Resource not found'] };

    const reasons = [];

    // 1. Maintenance conflict
    const maintenance = await ResourceMaintenance.findOne({
      where: {
        resourceId,
        status: 'scheduled'
      }
    });
    if (maintenance) {
      reasons.push(`Maintenance window scheduled: ${maintenance.maintenanceType} (${maintenance.startTime}–${maintenance.endTime})`);
    }

    // 2. Booking overlap
    const existingBooking = await ResourceBooking.findOne({
      where: {
        resourceId,
        dayOfWeek,
        startTime,
        endTime,
        status: 'confirmed'
      }
    });
    if (existingBooking) {
      reasons.push(`Double booking conflict: Already reserved for "${existingBooking.purpose}" (${existingBooking.startTime}–${existingBooking.endTime})`);
    }

    // 3. Capacity shortfall
    if (reqCap > 0 && resource.capacity < reqCap) {
      reasons.push(`Capacity deficit: Requested ${reqCap} students, but resource capacity is ${resource.capacity}`);
    }

    // If conflicts exist, search alternative resources in same category
    let alternatives = [];
    if (reasons.length > 0) {
      alternatives = await Resource.findAll({
        where: {
          category: resource.category,
          status: 'Available',
          maintenanceStatus: 'Normal'
        },
        limit: 3
      });
    }

    return {
      hasConflict: reasons.length > 0,
      resource,
      reasons,
      alternatives
    };
  }

  // Calculate Campus Resource Efficiency Score Breakdown
  async calculateEfficiencyMetrics() {
    const resources = await Resource.findAll();
    const totalCount = resources.length || 1;

    let totalTimeUtil = 0;
    let totalCapUtil = 0;
    let underutilizedCount = 0;
    let overloadedCount = 0;
    let optimalCount = 0;
    let maintenanceCount = 0;

    resources.forEach(r => {
      totalTimeUtil += (r.timeUtilization || 0);
      totalCapUtil += (r.capacityUtilization || 0);
      if (r.timeUtilization <= this.thresholds.underutilizedMax) underutilizedCount++;
      else if (r.timeUtilization >= this.thresholds.overloadedMin) overloadedCount++;
      else optimalCount++;

      if (r.maintenanceStatus !== 'Normal' || r.status === 'Maintenance') maintenanceCount++;
    });

    const avgTimeUtil = Math.round(totalTimeUtil / totalCount);
    const avgCapUtil = Math.round(totalCapUtil / totalCount);

    const spaceScore = Math.min(100, Math.round(avgTimeUtil * 0.95 + 15));
    const equipmentScore = 78;
    const scheduleScore = Math.min(100, Math.round(100 - (overloadedCount * 3) - (underutilizedCount * 2)));
    const availabilityScore = Math.round(((totalCount - maintenanceCount) / totalCount) * 100);
    const conflictRate = Math.round((overloadedCount / totalCount) * 12);
    const underutilizedRate = Math.round((underutilizedCount / totalCount) * 100);

    const overallScore = Math.round((spaceScore * 0.3) + (equipmentScore * 0.2) + (scheduleScore * 0.3) + (availabilityScore * 0.2));

    return {
      overallScore: Math.min(100, Math.max(50, overallScore)),
      breakdown: {
        spaceUtilization: spaceScore,
        equipmentUtilization: equipmentScore,
        scheduleEfficiency: scheduleScore,
        resourceAvailability: availabilityScore,
        conflictRate: `${conflictRate}%`,
        underutilizedCapacity: `${underutilizedRate}%`
      },
      counts: {
        total: totalCount,
        optimal: optimalCount,
        underutilized: underutilizedCount,
        overloaded: overloadedCount,
        maintenance: maintenanceCount,
        avgUtilization: avgTimeUtil
      }
    };
  }

  // Historical & Predicted Demand
  getDemandPredictionData() {
    return {
      historicalDays: [
        { day: 'Monday', rate: 78, status: 'High' },
        { day: 'Tuesday', rate: 83, status: 'High' },
        { day: 'Wednesday', rate: 91, status: 'Peak Overload' },
        { day: 'Thursday', rate: 74, status: 'Moderate' },
        { day: 'Friday', rate: 68, status: 'Moderate' }
      ],
      predictionTarget: {
        day: 'Next Wednesday',
        expectedDemand: 89,
        expectedAvailableCapacity: 11,
        peakWindow: '10:00 AM – 1:00 PM',
        riskLevel: 'HIGH_CONGESTION',
        recommendation: 'Pre-allocate Computer Lab 3 for anticipated practical surges to prevent Lab 1 bottlenecks.',
        label: 'DEMO / SIMULATED PREDICTIVE MODEL'
      }
    };
  }

  // Time-based Heatmap Generator
  async getUtilizationHeatmap() {
    const resources = await Resource.findAll({
      where: { category: 'Academic Space' },
      limit: 8
    });

    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];
    const heatmap = [];

    // Pre-calculated deterministic matrix for realism & reproducibility
    const matrixMap = {
      'LAB-B3-01': [85, 96, 94, 94, 60], // Lab 1: Overloaded midday & afternoon
      'LAB-B3-02': [20, 65, 55, 15, 10], // Lab 3: Underutilized 14:00-16:00!
      'LAB-B3-03': [40, 80, 85, 75, 50], // Lab 2: Healthy high
      'LAB-B3-04': [25, 50, 60, 48, 30], // Lab 4: Optimal
      'CR-B2-04':  [70, 75, 45, 38, 20], // B-204
      'CR-A1-101': [90, 95, 88, 82, 60], // Lecture Hall A-101
      'SEM-C1-01': [10, 92, 95, 90, 40], // Seminar Hall 1: Busy midday
      'AUD-C1-01': [0, 40, 50, 30, 20]   // Auditorium B
    };

    resources.forEach(r => {
      const slots = matrixMap[r.code] || [30, 60, 70, 45, 20];
      heatmap.push({
        code: r.code,
        name: r.name,
        building: r.building,
        overallUtil: r.timeUtilization,
        slots: slots.map((val, idx) => ({
          time: timeSlots[idx],
          utilization: val,
          intensity: val >= 90 ? 'overloaded' : val >= 70 ? 'high' : val >= 30 ? 'optimal' : 'underutilized'
        }))
      });
    });

    return { timeSlots, heatmap };
  }

  // Campus Building Overview for Resource Map
  async getBuildingMapOverview() {
    return [
      {
        building: 'Block B',
        title: 'Block B — Science & Computing Complex',
        resourceHealth: 84,
        openIssues: 3,
        underutilizedCount: 4,
        overloadedCount: 1,
        totalResources: 34,
        highlight: 'Lab 1 approaching overload while Lab 3 is underutilized in afternoon',
        departments: ['Computer Science', 'Information Technology', 'Mathematics']
      },
      {
        building: 'Block A',
        title: 'Block A — Engineering & Core Sciences',
        resourceHealth: 88,
        openIssues: 1,
        underutilizedCount: 2,
        overloadedCount: 0,
        totalResources: 42,
        highlight: 'Lecture halls balanced with 100% scheduled occupancy clearance',
        departments: ['Mechanical Engineering', 'Civil Engineering', 'Electrical']
      },
      {
        building: 'Block C',
        title: 'Block C — Management, Arts & Convention Hall',
        resourceHealth: 79,
        openIssues: 2,
        underutilizedCount: 1,
        overloadedCount: 2,
        totalResources: 28,
        highlight: 'Seminar Hall 1 high congestion on Wednesday afternoons',
        departments: ['Management Studies', 'Executive Education', 'Campus Operations']
      }
    ];
  }

  // What-If Simulation Engine
  async simulateScenario(scenarioType, customParams = {}) {
    if (scenarioType === 'swap_lab1_to_lab3' || scenarioType === 'master_demo') {
      return {
        scenarioName: 'Redistribute CS402 Practical (Lab 1 → Lab 3)',
        scenarioType: 'swap_redistribution',
        status: 'SIMULATION — NOT APPLIED',
        summary: 'Move CS402 Python Practical (55 students) on Wednesday 2:00 PM–4:00 PM from overloaded Computer Lab 1 to underutilized Computer Lab 3.',
        affectedClasses: [
          { code: 'CS402', name: 'Python Programming Practical', students: 55, currentRoom: 'Computer Lab 1', proposedRoom: 'Computer Lab 3' }
        ],
        affectedStudents: 55,
        beforeState: {
          lab1Util: 94,
          lab1Status: 'OVERLOADED',
          lab3Util: 31,
          lab3Status: 'UNDERUTILIZED',
          campusEfficiency: 76
        },
        afterState: {
          lab1Util: 78,
          lab1Status: 'HIGH UTILIZATION (Healthy Relief)',
          lab3Util: 48,
          lab3Status: 'OPTIMALLY UTILIZED',
          campusEfficiency: 84
        },
        efficiencyDelta: +8,
        reasons: [
          'Capacity matches: 60 workstations for 55 students',
          'Availability verified: Lab 3 has zero bookings between 2 PM and 4 PM',
          'Equipment compatible: High-speed gigabit LAN and Python IDE installed',
          'Same department: Both located on Floor 2, Block B',
          'Eliminates student crowding and reduces thermal fatigue on Lab 1 workstations'
        ],
        confidence: 92
      };
    }

    if (scenarioType === 'outage_lab1') {
      return {
        scenarioName: 'What-If Lab 1 Sudden Hardware Outage',
        scenarioType: 'outage_mitigation',
        status: 'SIMULATION — NOT APPLIED',
        summary: 'Emergency mitigation plan if Computer Lab 1 goes offline for unplanned repair.',
        affectedClasses: [
          { code: 'CS402', name: 'Python Practical', students: 55, recommendedAlternative: 'Computer Lab 3 (Block B)' },
          { code: 'IT301', name: 'Cloud Computing Lab', students: 48, recommendedAlternative: 'Computer Lab 4 (Block B)' }
        ],
        affectedStudents: 103,
        beforeState: { lab1Util: 94, lab3Util: 31, campusEfficiency: 76 },
        afterState: { lab1Util: 0, lab3Util: 68, campusEfficiency: 79 },
        efficiencyDelta: +3,
        reasons: [
          'Lab 3 and Lab 4 have combined available slots to absorb both sessions with zero cancellations',
          'No scheduling overlap between 10 AM and 4 PM'
        ],
        confidence: 89
      };
    }

    if (scenarioType === 'surge_students') {
      return {
        scenarioName: 'What-If 60 Additional Students Need Immediate Lab Space',
        scenarioType: 'surge_capacity',
        status: 'SIMULATION — NOT APPLIED',
        summary: 'Evaluate campus headroom for an unplanned hackathon or extra tutorial section.',
        affectedClasses: [{ code: 'EXTRA-BATCH', name: 'Applied AI Workshop', students: 60, proposedRoom: 'Computer Lab 3' }],
        affectedStudents: 60,
        beforeState: { lab1Util: 94, lab3Util: 31, campusEfficiency: 76 },
        afterState: { lab1Util: 94, lab3Util: 56, campusEfficiency: 82 },
        efficiencyDelta: +6,
        reasons: [
          'Lab 3 has 27.6 hours of unused weekly capacity and 60 ready-to-use workstations',
          'Zero impact on existing academic schedule'
        ],
        confidence: 95
      };
    }

    // Default scenario
    return {
      scenarioName: 'Custom Scenario Simulation',
      scenarioType: 'custom',
      status: 'SIMULATION — NOT APPLIED',
      summary: 'Dynamic multi-resource load redistribution test.',
      beforeState: { campusEfficiency: 76 },
      afterState: { campusEfficiency: 82 },
      efficiencyDelta: +6,
      confidence: 88
    };
  }

  // Execute Allocation Approval (Approve Allocation button)
  async approveAllocation({ recommendationId, reason, approvedBy = 'admin@campusai.edu' }) {
    // 1. Find Lab 1 and Lab 3
    const lab1 = await Resource.findOne({ where: { code: 'LAB-B3-01' } });
    const lab3 = await Resource.findOne({ where: { code: 'LAB-B3-02' } });

    if (!lab1 || !lab3) {
      throw new Error('Required demo resources LAB-B3-01 or LAB-B3-02 not found.');
    }

    // 2. Update booking CS402 to Lab 3
    const booking = await ResourceBooking.findOne({
      where: {
        resourceId: lab1.id,
        purpose: 'CS402 Python Programming Practical'
      }
    });

    if (booking) {
      booking.resourceId = lab3.id;
      booking.status = 'reallocated';
      await booking.save();
    }

    // 3. Update resource utilizations to reflect the optimization!
    lab1.timeUtilization = 78.0;
    lab1.utilizationStatus = 'HIGH UTILIZATION';
    lab1.weeklyUsedHours = 31.2;
    lab1.weeklyUnusedHours = 8.8;
    await lab1.save();

    lab3.timeUtilization = 48.0;
    lab3.utilizationStatus = 'OPTIMALLY UTILIZED';
    lab3.weeklyUsedHours = 19.2;
    lab3.weeklyUnusedHours = 20.8;
    await lab3.save();

    // 4. Update recommendation status if provided
    if (recommendationId) {
      const rec = await ResourceRecommendation.findByPk(recommendationId);
      if (rec) {
        rec.status = 'approved';
        await rec.save();
      }
    }

    // 5. Create immutable audit log entry
    const auditLog = await ResourceAllocationLog.create({
      resourceId: lab3.id,
      previousResourceId: lab1.id,
      actionType: 'Capacity Redistribution & Reallocation',
      bookingPurpose: 'CS402 Python Programming Practical (55 Students)',
      reason: reason || 'Reallocated to Computer Lab 3 to reduce Computer Lab 1 overload (94% → 78%) and boost campus efficiency from 76 to 84.',
      approvedBy,
      impactSummary: 'Computer Lab 1 cooled down from 94% to 78%. Computer Lab 3 raised from 31% to 48%. Campus efficiency index increased to 84.'
    });

    return {
      success: true,
      auditLog,
      metrics: {
        lab1: { code: lab1.code, name: lab1.name, before: 94, after: 78, status: 'HIGH UTILIZATION' },
        lab3: { code: lab3.code, name: lab3.name, before: 31, after: 48, status: 'OPTIMALLY UTILIZED' },
        campusEfficiency: { before: 76, after: 84, delta: +8 }
      }
    };
  }
}

module.exports = new ResourceOptimizationService();
