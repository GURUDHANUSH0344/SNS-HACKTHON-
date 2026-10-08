const {
  Resource,
  CampusProblem,
  ResourceBooking,
  ResourceMaintenance,
  ResourceRecommendation,
  Department
} = require('../models');
const resourceOptimizationService = require('./resourceOptimizationService');

class CampusMapService {
  constructor() {
    // Configurable Campus Geographic Center (Coimbatore SNS Academic Campus baseline)
    this.campusCenter = {
      lat: 11.0254,
      lng: 76.9048,
      zoom: 17,
      name: 'CAMPUS AI Sovereign University Complex',
      code: 'CAMPUSAI-CENTRAL'
    };

    // Canonical Campus Master Buildings Specification
    this.masterBuildings = [
      {
        id: 'BLD-A',
        name: 'Block A — Engineering & Core Sciences',
        shortName: 'Block A',
        code: 'BLD-A',
        category: 'Academic',
        department: 'Engineering & Applied Sciences',
        center: [11.0263, 76.9038],
        polygon: [
          [11.0267, 76.9034],
          [11.0267, 76.9042],
          [11.0259, 76.9042],
          [11.0259, 76.9034]
        ],
        floors: 4,
        capacity: 1200,
        currentOccupancy: 816,
        timeUtilization: 68,
        operationalStatus: 'Operational',
        inCharge: 'Dr. Robert Lang (Dean of Engineering)',
        contactEmail: 'engineering.dean@campusai.edu',
        operatingHours: '08:00 AM – 06:30 PM',
        openIssuesCount: 1,
        criticalIssuesCount: 0,
        resourcesCount: 42,
        maintenanceCount: 0,
        studentDensity: 'Moderate',
        wifiHealth: 'Excellent (98% RSSI)',
        description: 'Houses Core Mechanical, Civil, and Electrical classrooms with heavy industrial workshops.',
        aiInsightSummary: 'Operating at healthy 68% utilization. Lecture halls balanced with zero timetable collision risk.',
        aiWhy: ['Balanced morning and afternoon shift timetables', 'Fully operational HVAC infrastructure'],
        aiRecommendedAction: 'Continue nominal timetable dispatch. Periodic routine check on Ground Floor electrical sub-panel.'
      },
      {
        id: 'BLD-B',
        name: 'Block B — Science & Computing Complex',
        shortName: 'Block B',
        code: 'BLD-B',
        category: 'Computing & AI',
        department: 'Computer Science & AI/Data Science',
        center: [11.0261, 76.9056],
        polygon: [
          [11.0266, 76.9051],
          [11.0266, 76.9061],
          [11.0256, 76.9061],
          [11.0256, 76.9051]
        ],
        floors: 4,
        capacity: 950,
        currentOccupancy: 826,
        timeUtilization: 87,
        operationalStatus: 'High Congestion / Active Hotspot',
        inCharge: 'Dr. Sarah Jenkins (Head of AI & Computing)',
        contactEmail: 'computing.hod@campusai.edu',
        operatingHours: '08:00 AM – 08:00 PM',
        openIssuesCount: 7,
        criticalIssuesCount: 1,
        resourcesCount: 34,
        maintenanceCount: 2,
        studentDensity: 'Very High (Peak 2–4 PM)',
        wifiHealth: 'Degraded (Floor 2 & 3 Packet Drops)',
        description: 'Computing backbone hosting AI research labs, GPU clusters, Computer Labs 1–4, and software incubation centers.',
        aiInsightSummary: 'Block B currently operates at high utilization (87%) with an acute network switch bottleneck on Floor 2 and Computer Lab 1 severe overload (94%).',
        aiWhy: [
          'High concentration of practical coding cohorts (CS402 Python, IT301 Cloud)',
          '7 correlated network tickets indicating Floor 2 IDF switch PoE capacity overload',
          'Computer Lab 1 saturated while identical Lab 3 remains 69% idle'
        ],
        aiRecommendedAction: '1. Reallocate CS402 Practical from Lab 1 to Lab 3 (+8 Campus Efficiency lift).\n2. Dispatch IT Network technician to reset Floor 2 IDF switch distribution trunk.'
      },
      {
        id: 'BLD-C',
        name: 'Block C — Management, Arts & Convention Hall',
        shortName: 'Block C',
        code: 'BLD-C',
        category: 'Management',
        department: 'School of Management & Humanities',
        center: [11.0246, 76.9039],
        polygon: [
          [11.0250, 76.9034],
          [11.0250, 76.9044],
          [11.0242, 76.9044],
          [11.0242, 76.9034]
        ],
        floors: 3,
        capacity: 800,
        currentOccupancy: 248,
        timeUtilization: 31,
        operationalStatus: 'Underutilized Capacity Opportunity',
        inCharge: 'Prof. David Vance (Director, Management)',
        contactEmail: 'management.dir@campusai.edu',
        operatingHours: '08:30 AM – 05:30 PM',
        openIssuesCount: 2,
        criticalIssuesCount: 0,
        resourcesCount: 28,
        maintenanceCount: 1,
        studentDensity: 'Low',
        wifiHealth: 'Good (94% RSSI)',
        description: 'Executive MBA lecture theaters, case study rooms, and the multi-purpose Seminar Hall 1.',
        aiInsightSummary: 'Substantial idle capacity available (31% utilization). Prime recipient for classroom re-routing during Block B peak congestion.',
        aiWhy: ['Executive MBA cohorts mostly scheduled on morning and weekend tracks', 'Large surplus seating in seminar suites'],
        aiRecommendedAction: 'Enable dynamic cross-department allocation to absorb overflow students from overloaded Computing blocks.'
      },
      {
        id: 'BLD-LIB',
        name: 'Central Library & Digital Knowledge Hub',
        shortName: 'Central Library',
        code: 'BLD-LIB',
        category: 'Academic Facility',
        department: 'University Library Services',
        center: [11.0253, 76.9048],
        polygon: [
          [11.0256, 76.9045],
          [11.0256, 76.9051],
          [11.0250, 76.9051],
          [11.0250, 76.9045]
        ],
        floors: 3,
        capacity: 1500,
        currentOccupancy: 1080,
        timeUtilization: 72,
        operationalStatus: 'Operational',
        inCharge: 'Mrs. Evelyn Clark (Chief Librarian)',
        contactEmail: 'library@campusai.edu',
        operatingHours: '07:30 AM – 10:00 PM',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 18,
        maintenanceCount: 0,
        studentDensity: 'High (Quiet Study)',
        wifiHealth: 'Excellent (Gigabit Wi-Fi 6)',
        description: '300,000 volumes, automated RFID return kiosks, 24 digital research pods, and collaborative group study areas.',
        aiInsightSummary: 'Optimal study hub occupancy with 72% utilization. Air filtration and acoustic sensors indicate peak comfort.',
        aiWhy: ['Continuous student footfall balanced across 3 quiet study zones'],
        aiRecommendedAction: 'Maintain current extended evening schedule (open until 10:00 PM).'
      },
      {
        id: 'BLD-ADMIN',
        name: 'Administrative Complex & Placement Cell',
        shortName: 'Admin Complex',
        code: 'BLD-ADMIN',
        category: 'Administration',
        department: 'University Registrar & Career Services',
        center: [11.0247, 76.9058],
        polygon: [
          [11.0250, 76.9054],
          [11.0250, 76.9062],
          [11.0244, 76.9062],
          [11.0244, 76.9054]
        ],
        floors: 2,
        capacity: 350,
        currentOccupancy: 210,
        timeUtilization: 60,
        operationalStatus: 'Operational',
        inCharge: 'Dr. Arthur Vance (Dean / Executive Admin)',
        contactEmail: 'admin@campusai.edu',
        operatingHours: '09:00 AM – 05:00 PM',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 12,
        maintenanceCount: 0,
        studentDensity: 'Moderate',
        wifiHealth: 'Excellent',
        description: 'Houses the Vice-Chancellor Office, Admissions Wing, Fee Accounts Counter, and Corporate Placement Interview Suites.',
        aiInsightSummary: 'Standard administrative rhythm. Placement interview suites operating at 100% SLA readiness.',
        aiWhy: ['Pre-placement training interviews scheduled in orderly 30-minute windows'],
        aiRecommendedAction: 'Pre-schedule boardrooms for upcoming campus placement recruitment drives.'
      },
      {
        id: 'BLD-AUD',
        name: 'Main University Auditorium & Convention Center',
        shortName: 'Main Auditorium',
        code: 'BLD-AUD',
        category: 'Auditorium',
        department: 'Campus Events & Cultural Affairs',
        center: [11.0242, 76.9049],
        polygon: [
          [11.0245, 76.9045],
          [11.0245, 76.9053],
          [11.0239, 76.9053],
          [11.0239, 76.9045]
        ],
        floors: 2,
        capacity: 1400,
        currentOccupancy: 0,
        timeUtilization: 25,
        operationalStatus: 'Idle / Scheduled Maintenance',
        inCharge: 'Mr. Rajesh Kumar (Facility Director)',
        contactEmail: 'auditorium@campusai.edu',
        operatingHours: '09:00 AM – 09:00 PM (By Reservation)',
        openIssuesCount: 1,
        criticalIssuesCount: 0,
        resourcesCount: 6,
        maintenanceCount: 1,
        studentDensity: 'Low',
        wifiHealth: 'Good',
        description: 'Acoustically treated 1,400-seat theater with motorized proscenium stage, dual digital cinema projectors, and VIP green rooms.',
        aiInsightSummary: 'Low weekday utilization (25%). Sound engineer scheduled for quarterly acoustic calibration.',
        aiWhy: ['Convention hall reserved primarily for major symposiums and hackathon final presentations'],
        aiRecommendedAction: 'Reserved for upcoming AI Hackathon Grand Finale on Friday.'
      },
      {
        id: 'BLD-INNOV',
        name: 'Innovation, Robotics & Incubation Sandbox',
        shortName: 'Innovation Hub',
        code: 'BLD-INNOV',
        category: 'Research & Labs',
        department: 'Research & Development Cell',
        center: [11.0268, 76.9050],
        polygon: [
          [11.0271, 76.9046],
          [11.0271, 76.9054],
          [11.0265, 76.9054],
          [11.0265, 76.9046]
        ],
        floors: 2,
        capacity: 250,
        currentOccupancy: 112,
        timeUtilization: 45,
        operationalStatus: 'Operational',
        inCharge: 'Prof. Alistair Chen (Chief Innovation Officer)',
        contactEmail: 'innovation@campusai.edu',
        operatingHours: '24/7 Access (Card Controlled)',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 16,
        maintenanceCount: 0,
        studentDensity: 'Moderate',
        wifiHealth: 'Ultra-Fast (Dedicated 10G Uplink)',
        description: 'Makerspace equipped with 3D printers, robotic arm test benches, IoT sensor rigs, and GPU development clusters.',
        aiInsightSummary: '24/7 research sandbox utilized by student founders and patent investigators.',
        aiWhy: ['Active prototyping sessions running with consistent power telemetry'],
        aiRecommendedAction: 'Ensure 3D printer filament and consumable restock before weekend hackathon.'
      },
      {
        id: 'BLD-CANTEEN',
        name: 'Central Food Court & Dining Pavilion',
        shortName: 'Cafeteria',
        code: 'BLD-CANTEEN',
        category: 'Amenities',
        department: 'Campus Hospitality Services',
        center: [11.0253, 76.9033],
        polygon: [
          [11.0256, 76.9030],
          [11.0256, 76.9036],
          [11.0250, 76.9036],
          [11.0250, 76.9030]
        ],
        floors: 2,
        capacity: 650,
        currentOccupancy: 390,
        timeUtilization: 60,
        operationalStatus: 'Operational',
        inCharge: 'Campus Dining Services',
        contactEmail: 'dining@campusai.edu',
        operatingHours: '07:30 AM – 09:30 PM',
        openIssuesCount: 1,
        criticalIssuesCount: 0,
        resourcesCount: 8,
        maintenanceCount: 0,
        studentDensity: 'High (Lunch Surge)',
        wifiHealth: 'Good',
        description: 'Multi-cuisine dining pavilion, barista coffee lounge, student seating terrace, and hygienic central commissary.',
        aiInsightSummary: 'Standard dining cycles with predictable peak lunch volume between 12:30 PM and 01:45 PM.',
        aiWhy: ['Staggered department lunch breaks prevent seating congestion'],
        aiRecommendedAction: 'Replenish automated smart tap dispensers before afternoon rush.'
      },
      {
        id: 'BLD-MED',
        name: 'University Health & Medical Center',
        shortName: 'Medical Center',
        code: 'BLD-MED',
        category: 'Emergency & Health',
        department: 'Campus Medical Affairs',
        center: [11.0240, 76.9035],
        polygon: [
          [11.0243, 76.9032],
          [11.0243, 76.9038],
          [11.0237, 76.9038],
          [11.0237, 76.9032]
        ],
        floors: 1,
        capacity: 50,
        currentOccupancy: 8,
        timeUtilization: 16,
        operationalStatus: 'Operational 24/7',
        inCharge: 'Dr. Meera Nair (Chief Medical Officer)',
        contactEmail: 'medical.care@campusai.edu',
        operatingHours: '24/7 Emergency Triage',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 6,
        maintenanceCount: 0,
        studentDensity: 'Low',
        wifiHealth: 'Priority Secure Line',
        description: '24/7 physician clinic, 6-bed emergency stabilization ward, pharmacy, and dedicated ambulance bay.',
        aiInsightSummary: 'Medical standby at full readiness. Zero emergency admissions currently logged.',
        aiWhy: ['Ambulance bay unblocked and life-support batteries at 100% verification'],
        aiRecommendedAction: 'Maintain uninterrupted 24/7 emergency response protocols.'
      },
      {
        id: 'BLD-HOSTEL-A',
        name: 'Aryabhatta Student Residence (Boys Hostel A)',
        shortName: 'Boys Hostel',
        code: 'BLD-HOSTEL-A',
        category: 'Residential',
        department: 'Hostel Administration',
        center: [11.0268, 76.9064],
        polygon: [
          [11.0272, 76.9060],
          [11.0272, 76.9068],
          [11.0264, 76.9068],
          [11.0264, 76.9060]
        ],
        floors: 5,
        capacity: 450,
        currentOccupancy: 412,
        timeUtilization: 91,
        operationalStatus: 'Operational',
        inCharge: 'Mr. Sundaram K (Chief Warden)',
        contactEmail: 'hostel.boys@campusai.edu',
        operatingHours: '24/7 Residential (Curfew: 09:30 PM)',
        openIssuesCount: 1,
        criticalIssuesCount: 0,
        resourcesCount: 22,
        maintenanceCount: 0,
        studentDensity: 'High (Evening)',
        wifiHealth: 'Good (Mesh Coverage)',
        description: '5-story student housing with study commons, recreation lounge, laundry stations, and high-speed Wi-Fi mesh.',
        aiInsightSummary: 'Residential capacity at 91% occupancy. Hot water solar arrays operating nominally.',
        aiWhy: ['Full semester allocation completed with active biometric turnstiles'],
        aiRecommendedAction: 'Regular floor warden rounds scheduled at 09:00 PM.'
      },
      {
        id: 'BLD-HOSTEL-B',
        name: 'Gargi Student Residence (Girls Hostel B)',
        shortName: 'Girls Hostel',
        code: 'BLD-HOSTEL-B',
        category: 'Residential',
        department: 'Hostel Administration',
        center: [11.0242, 76.9065],
        polygon: [
          [11.0246, 76.9061],
          [11.0246, 76.9069],
          [11.0238, 76.9069],
          [11.0238, 76.9061]
        ],
        floors: 5,
        capacity: 450,
        currentOccupancy: 405,
        timeUtilization: 90,
        operationalStatus: 'Operational',
        inCharge: 'Dr. Radhika Sen (Warden In-Charge)',
        contactEmail: 'hostel.girls@campusai.edu',
        operatingHours: '24/7 Residential (Curfew: 09:00 PM)',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 22,
        maintenanceCount: 0,
        studentDensity: 'High (Evening)',
        wifiHealth: 'Good (Mesh Coverage)',
        description: 'Secure biometric residential facility with indoor badminton, study library, and health clinic access.',
        aiInsightSummary: 'All residential safety and power backup systems tested 100% operational.',
        aiWhy: ['Automated perimeter illumination and CCTV telemetry green'],
        aiRecommendedAction: 'Continue standard residential protocols.'
      },
      {
        id: 'BLD-SPORTS',
        name: 'University Sports Complex & Stadium',
        shortName: 'Sports Complex',
        code: 'BLD-SPORTS',
        category: 'Sports & Athletics',
        department: 'Physical Education & Athletics',
        center: [11.0240, 76.9056],
        polygon: [
          [11.0243, 76.9053],
          [11.0243, 76.9060],
          [11.0237, 76.9060],
          [11.0237, 76.9053]
        ],
        floors: 1,
        capacity: 800,
        currentOccupancy: 120,
        timeUtilization: 40,
        operationalStatus: 'Operational',
        inCharge: 'Coach John Mathews (Sports Director)',
        contactEmail: 'sports@campusai.edu',
        operatingHours: '06:00 AM – 08:30 PM',
        openIssuesCount: 0,
        criticalIssuesCount: 0,
        resourcesCount: 14,
        maintenanceCount: 0,
        studentDensity: 'High (Morning / Dusk)',
        wifiHealth: 'Moderate',
        description: 'Synthetic running track, floodlit basketball court, wooden badminton arena, gymnasium, and sports equipment store.',
        aiInsightSummary: 'Sports facilities active during morning (06:00–08:30) and evening hours (16:30–19:30).',
        aiWhy: ['Intramural tournament preparations underway with nominal court wear'],
        aiRecommendedAction: 'Floodlight inspection scheduled ahead of evening basketball league.'
      }
    ];

    // Layers master list
    this.layers = [
      { id: 'buildings', name: 'Campus Buildings & Footprints', icon: '🏛️', defaultEnabled: true },
      { id: 'resources', name: 'Academic Spaces & Labs', icon: '⚡', defaultEnabled: true },
      { id: 'issues', name: 'Active Problems & Helpdesk', icon: '🚨', defaultEnabled: true },
      { id: 'underutilized', name: 'Underutilized Resources (≤30%)', icon: '📉', defaultEnabled: false },
      { id: 'overloaded', name: 'Overloaded Bottlenecks (≥91%)', icon: '⚠️', defaultEnabled: true },
      { id: 'maintenance', name: 'Scheduled Maintenance', icon: '🛠️', defaultEnabled: false },
      { id: 'risk', name: 'Academic Risk & Congestion', icon: '🔥', defaultEnabled: false },
      { id: 'density', name: 'Student Density Zones', icon: '👥', defaultEnabled: false },
      { id: 'wifi', name: 'Wi-Fi & Network Health', icon: '📶', defaultEnabled: true },
      { id: 'emergency', name: 'Emergency & Medical Points', icon: '🏥', defaultEnabled: false },
      { id: 'facilities', name: 'Amenities & Student Services', icon: '☕', defaultEnabled: false }
    ];
  }

  // Build the complete map state bundle
  async getCampusMapBundle(userRole = 'admin') {
    // 1. Fetch real DB Resources and match them to geographic coordinates
    const dbResources = await Resource.findAll({
      order: [['timeUtilization', 'DESC']]
    });

    const geoResources = this.mapResourcesToCoordinates(dbResources);

    // 2. Fetch real DB Campus Problems and match them geographically
    const dbProblems = await CampusProblem.findAll({
      where: {
        status: ['Open', 'In Progress', 'Escalated']
      },
      order: [['createdAt', 'DESC']]
    });

    const geoIssues = this.mapProblemsToCoordinates(dbProblems);

    // 3. Detect Intelligent Spatial Problem Clusters
    const problemClusters = this.detectSpatialIssueClusters(geoIssues);

    // 4. Calculate Spatial Hotspots
    const hotspots = this.calculateCampusHotspots(geoResources, geoIssues, problemClusters);

    // 5. Calculate Campus Health Overview
    const campusHealth = this.calculateCampusHealth(geoResources, geoIssues);

    // 6. Aggregate KPIs
    const kpis = {
      overallUtilization: 74,
      activeIssues: geoIssues.length || 12,
      totalResources: geoResources.length || 86,
      activeMaintenance: 5,
      detectedHotspots: hotspots.length || 3,
      healthScore: campusHealth.overallScore,
      emergencyStatus: 'All Systems Normal'
    };

    // 7. Filter data based on User Role for privacy & security
    const sanitizedBuildings = this.filterByRole(this.masterBuildings, userRole);
    const sanitizedIssues = userRole === 'student'
      ? geoIssues.filter(i => i.isStudentVisible !== false)
      : geoIssues;

    return {
      campusCenter: this.campusCenter,
      kpis,
      campusHealth,
      layers: this.layers,
      buildings: sanitizedBuildings,
      resources: geoResources,
      issues: sanitizedIssues,
      problemClusters,
      hotspots,
      userRole
    };
  }

  // Geocode resources based on their assigned building and room
  mapResourcesToCoordinates(dbResources) {
    // Building base coordinate anchors
    const buildingAnchors = {
      'Block B': [11.0261, 76.9056],
      'Block A': [11.0263, 76.9038],
      'Block C': [11.0246, 76.9039],
      'Central Library': [11.0253, 76.9048],
      'Admin Complex': [11.0247, 76.9058],
      'Innovation Hub': [11.0268, 76.9050],
      'Auditorium': [11.0242, 76.9049],
      'Cafeteria': [11.0253, 76.9033]
    };

    return dbResources.map((r, index) => {
      const bKey = Object.keys(buildingAnchors).find(k => r.building && r.building.includes(k)) || 'Block B';
      const anchor = buildingAnchors[bKey] || [11.0261, 76.9056];
      
      // Compute slight deterministic spatial jitter so pins inside the same building do not directly overlap
      const angle = (index * 42) % 360;
      const rad = (angle * Math.PI) / 180;
      const distance = 0.00018 + ((index % 4) * 0.00007);
      const lat = Number((anchor[0] + Math.sin(rad) * distance).toFixed(6));
      const lng = Number((anchor[1] + Math.cos(rad) * distance).toFixed(6));

      return {
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        category: r.category,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        department: r.department,
        status: r.status,
        utilizationStatus: r.utilizationStatus,
        timeUtilization: r.timeUtilization,
        capacityUtilization: r.capacityUtilization,
        averageOccupancy: r.averageOccupancy,
        weeklyUsedHours: r.weeklyUsedHours,
        weeklyAvailableHours: r.weeklyAvailableHours,
        equipmentSpecs: typeof r.equipmentSpecs === 'string' ? JSON.parse(r.equipmentSpecs || '[]') : r.equipmentSpecs,
        lat,
        lng,
        isOverloaded: r.timeUtilization >= 90,
        isUnderutilized: r.timeUtilization <= 30,
        isOptimal: r.timeUtilization > 30 && r.timeUtilization < 90
      };
    });
  }

  // Geocode active problems and assign rich spatial metadata
  mapProblemsToCoordinates(dbProblems) {
    const buildingAnchors = {
      'Block B': [11.0261, 76.9056],
      'Block A': [11.0263, 76.9038],
      'Block C': [11.0246, 76.9039]
    };

    // If DB has fewer problems, ensure we supplement with realistic demo problem reports
    let issues = dbProblems.map((p, idx) => {
      const anchor = buildingAnchors[p.block === 'A' ? 'Block A' : (p.block === 'C' ? 'Block C' : 'Block B')] || [11.0261, 76.9056];
      const offsetLat = (idx * 0.00006) - 0.00003;
      const offsetLng = ((idx % 3) * 0.00007) - 0.00003;

      return {
        id: p.id,
        ticketNumber: p.ticketNumber,
        title: p.title,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory || 'General Hardware',
        building: p.building,
        block: p.block,
        floor: p.floor,
        room: p.room,
        priority: p.priority,
        status: p.status,
        slaHours: 4,
        slaRemaining: '2h 15m remaining',
        affectedStudents: p.priority === 'Critical' ? 140 : (p.priority === 'High' ? 65 : 20),
        lat: Number((anchor[0] + offsetLat).toFixed(6)),
        lng: Number((anchor[1] + offsetLng).toFixed(6)),
        reportedTime: '45 mins ago',
        assignedTeam: p.category.includes('Network') ? 'Campus IT NOC' : 'Facilities Maintenance',
        isStudentVisible: true
      };
    });

    // Seed robust multi-report issues for the Block B Network Cluster demo if under 5 items
    if (issues.length < 5) {
      const extraDemoIssues = [
        {
          id: 101,
          ticketNumber: 'CR-1041',
          title: 'Wi-Fi Drops and High Latency on Block B Fl 2 Corridor',
          description: 'Students unable to pull PyTorch packages during CS402 lab. Gateway packet loss 34%.',
          category: 'Network & IT',
          subcategory: 'Wi-Fi Access Point',
          building: 'Block B',
          block: 'B',
          floor: 'Floor 2',
          room: 'Room B-201',
          priority: 'High',
          status: 'In Progress',
          slaRemaining: '1h 45m',
          affectedStudents: 60,
          lat: 11.02615,
          lng: 76.90558,
          reportedTime: '30m ago',
          assignedTeam: 'Campus IT NOC'
        },
        {
          id: 102,
          ticketNumber: 'CR-1042',
          title: 'Floor 2 IDF PoE Switch Intermittent Power Flap',
          description: 'Core switch AP-B2-04 rebooted twice under peak 5GHz radio load.',
          category: 'Network & IT',
          subcategory: 'Switch Infrastructure',
          building: 'Block B',
          block: 'B',
          floor: 'Floor 2',
          room: 'Server Closet B-200',
          priority: 'Critical',
          status: 'In Progress',
          slaRemaining: '45m',
          affectedStudents: 126,
          lat: 11.02608,
          lng: 76.90562,
          reportedTime: '15m ago',
          assignedTeam: 'Campus IT NOC'
        },
        {
          id: 103,
          ticketNumber: 'CR-1043',
          title: 'Workstation Network Jack dead in Computer Lab 1 (Rack 4)',
          description: 'RJ45 port dead on student workstations 19 through 24.',
          category: 'Network & IT',
          subcategory: 'Ethernet Drop',
          building: 'Block B',
          block: 'B',
          floor: 'Floor 2',
          room: 'Computer Lab 1',
          priority: 'High',
          status: 'Open',
          slaRemaining: '3h 10m',
          affectedStudents: 24,
          lat: 11.02619,
          lng: 76.90567,
          reportedTime: '1h ago',
          assignedTeam: 'Hardware Maintenance'
        },
        {
          id: 104,
          ticketNumber: 'CR-1044',
          title: 'SSID CampusAI-Student invisible in Computer Lab 3',
          description: 'Laptops hunting for 2.4GHz beacon from Block A instead of local AP.',
          category: 'Network & IT',
          subcategory: 'Wi-Fi SSID Broadcast',
          building: 'Block B',
          block: 'B',
          floor: 'Floor 2',
          room: 'Computer Lab 3',
          priority: 'Medium',
          status: 'Open',
          slaRemaining: '4h 00m',
          affectedStudents: 35,
          lat: 11.02604,
          lng: 76.90552,
          reportedTime: '1h 15m ago',
          assignedTeam: 'Campus IT NOC'
        },
        {
          id: 105,
          ticketNumber: 'CR-1045',
          title: 'Projector HDMI Flicker in Seminar Hall 1',
          description: 'Center display drops signal every 10 minutes during presentations.',
          category: 'AV & Multimedia',
          subcategory: 'Digital Projector',
          building: 'Block C',
          block: 'C',
          floor: 'Floor 1',
          room: 'Seminar Hall 1',
          priority: 'Medium',
          status: 'Open',
          slaRemaining: '5h 30m',
          affectedStudents: 85,
          lat: 11.02462,
          lng: 76.90395,
          reportedTime: '2h ago',
          assignedTeam: 'AV Support'
        },
        {
          id: 106,
          ticketNumber: 'CR-1046',
          title: 'Water Cooler Drainage Overflow near LH-102',
          description: 'Minor leakage pooling near main classroom corridor doorway.',
          category: 'Facilities & Plumbing',
          subcategory: 'Plumbing Drainage',
          building: 'Block A',
          block: 'A',
          floor: 'Floor 1',
          room: 'Corridor LH-102',
          priority: 'Low',
          status: 'In Progress',
          slaRemaining: '6h 00m',
          affectedStudents: 40,
          lat: 11.02632,
          lng: 76.90382,
          reportedTime: '3h ago',
          assignedTeam: 'Plumbing Services'
        }
      ];

      issues = [...issues, ...extraDemoIssues];
    }

    return issues;
  }

  // Detect and group proximate tickets into Intelligent Root-Cause Problem Clusters
  detectSpatialIssueClusters(issues) {
    const blockBIssues = issues.filter(i => (i.building && i.building.includes('Block B')) || i.block === 'B');
    const networkIssues = blockBIssues.filter(i => i.category && i.category.toLowerCase().includes('network'));

    const clusters = [];

    if (networkIssues.length >= 2) {
      clusters.push({
        id: 'CLUSTER-NET-BLD-B',
        title: 'Block B Distribution Network Bottleneck Cluster',
        buildingId: 'BLD-B',
        buildingName: 'Block B — Science & Computing Complex',
        center: [11.0261, 76.9056],
        radiusMeters: 45,
        totalReports: 7, // Simulated multi-user aggregated signals
        rawIssueCount: networkIssues.length,
        primaryCategory: 'Network & Infrastructure',
        severity: 'Critical Hotspot',
        affectedFloors: 'Floor 1, Floor 2, Floor 3',
        affectedStudentsTotal: 420,
        slaStatus: 'Action Required (Under Escalation)',
        possibleRootCause: 'Core switch PoE saturation on Block B Floor 2 distribution IDF rack causing cascading 5GHz radio flaps under peak afternoon student traffic.',
        recommendedAction: 'Inspect Floor 2 IDF distribution switch, restart PoE power bank, and verify gigabit uplink trunk before afternoon lab surge.',
        reportedIssues: networkIssues
      });
    }

    return clusters;
  }

  // Calculate Campus Hotspots
  calculateCampusHotspots(resources, issues, clusters) {
    return [
      {
        id: 'HOTSPOT-1',
        type: 'Network Infrastructure Cluster',
        title: 'Block B Wi-Fi & Switch Outage Cluster',
        location: 'Block B (Floors 2 & 3)',
        severity: 'Critical',
        badgeColor: '#B91C1C',
        lat: 11.0261,
        lng: 76.9056,
        count: 7,
        trend: 'Increasing (Last 2 hours)',
        detail: '7 correlated reports across Computer Labs 1–3 indicating common Floor 2 IDF switch failure.',
        action: 'Inspect Block B Network Distribution Switch'
      },
      {
        id: 'HOTSPOT-2',
        type: 'Resource Capacity Bottleneck',
        title: 'Computer Lab 1 Overload Saturation (94%)',
        location: 'Block B — Floor 2 (Lab 1)',
        severity: 'High Warning',
        badgeColor: '#B45309',
        lat: 11.0262,
        lng: 76.9057,
        count: 1,
        trend: 'Recurring Daily at 2:00 PM',
        detail: 'Operating at 94% time utilization with 55 students in CS402 Python practical while Lab 3 is 69% idle.',
        action: 'Reallocate CS402 to Computer Lab 3'
      },
      {
        id: 'HOTSPOT-3',
        type: 'High Student Density Zone',
        title: 'Central Library Study Pod Peak Congestion',
        location: 'Central Library (Floors 1 & 2)',
        severity: 'Moderate',
        badgeColor: '#1E4E8C',
        lat: 11.0253,
        lng: 76.9048,
        count: 0,
        trend: 'Stable Peak',
        detail: '85% study carrel occupancy during pre-exam revision window. Air quality and acoustics healthy.',
        action: 'Enable overflow seating in Annex'
      }
    ];
  }

  // Calculate Campus Health Score Model
  calculateCampusHealth(resources, issues) {
    return {
      overallScore: 84,
      grade: 'A — Institutional Distinction',
      breakdown: {
        academic: 88,
        infrastructure: 79,
        resources: 86,
        issueResolution: 82,
        studentServices: 91
      },
      summary: 'Campus operates at robust 84/100 health. Primary operational bottlenecks isolated to Block B network distribution and Computer Lab 1 scheduling load.'
    };
  }

  // What-If Simulation Engine for Campus Map
  simulateScenario(scenarioId) {
    if (scenarioId === 'block_b_outage') {
      return {
        scenarioId: 'block_b_outage',
        title: 'What-If: Block B Entire Complex Emergency Outage',
        impactSummary: 'Simulates complete electrical or structural shutdown of Block B Computing Complex.',
        affectedBuildings: ['BLD-B'],
        highlightCoordinates: [11.0261, 76.9056],
        metrics: {
          classroomsAffected: 8,
          labsAffected: 4,
          studentsAffected: 620,
          classesAffected: 27,
          campusHealthDelta: -12
        },
        mitigationPlan: [
          'Automatically reroute 18 lecture sessions to Block A Floor 3 surplus classrooms.',
          'Reallocate Computer Lab 1 & 2 cohorts to Block C Seminar Hall and Innovation Hub.',
          'Broadcast instant smart notification alert to 620 enrolled students via CampusAI mobile app.',
          'Zero class cancellations required under optimized multi-building load redistribution.'
        ],
        beforeState: { campusEfficiency: 76, activeIssues: 12 },
        afterState: { campusEfficiency: 64, activeIssues: 24, reroutedPercentage: '92%' },
        recommendation: 'Activate Contingency Protocol Alpha: Execute dynamic timetable transfer to Block A & C.'
      };
    }

    if (scenarioId === 'lab1_to_lab3' || scenarioId === 'master_rebalance') {
      return {
        scenarioId: 'lab1_to_lab3',
        title: 'What-If: Shift CS402 Practical from Lab 1 (94%) to Lab 3 (31%)',
        impactSummary: 'Autonomous load redistribution of Class CS402 (55 students) on Wednesday 2:00 PM–4:00 PM.',
        affectedBuildings: ['BLD-B'],
        highlightCoordinates: [11.0261, 76.9056],
        metrics: {
          lab1UtilBefore: 94,
          lab1UtilAfter: 78,
          lab3UtilBefore: 31,
          lab3UtilAfter: 48,
          studentsMoved: 55,
          campusEfficiencyDelta: +8
        },
        mitigationPlan: [
          'Computer Lab 1 cooled down from 94% to 78% (Healthy Relief).',
          'Computer Lab 3 productive capacity recovered from 31% to 48%.',
          'Workstation thermal fatigue reduced by 32%.',
          'Campus Efficiency Index boosted from 76 to 84 (+8 points).'
        ],
        beforeState: { campusEfficiency: 76, lab1Status: 'OVERLOADED', lab3Status: 'UNDERUTILIZED' },
        afterState: { campusEfficiency: 84, lab1Status: 'HEALTHY', lab3Status: 'OPTIMALLY UTILIZED' },
        recommendation: 'Approve allocation transfer in timetable registry with one click.'
      };
    }

    if (scenarioId === 'surge_200_students') {
      return {
        scenarioId: 'surge_200_students',
        title: 'What-If: Unplanned Surge of 200 Students for Hackathon Bootcamp',
        impactSummary: 'Evaluates campus capacity headroom to host 200 visiting students without academic schedule collision.',
        affectedBuildings: ['BLD-C', 'BLD-INNOV', 'BLD-LIB'],
        highlightCoordinates: [11.0246, 76.9039],
        metrics: {
          classroomsAffected: 4,
          labsAffected: 2,
          studentsAbsorbed: 200,
          campusHealthDelta: +4
        },
        mitigationPlan: [
          'Block C Seminar Hall 1 absorbs 100 students immediately (free until 04:00 PM).',
          'Innovation Hub Sandbox absorbs 60 students on high-spec prototyping benches.',
          'Central Library Digital Pod annex absorbs 40 students with zero timetable collision.'
        ],
        beforeState: { campusEfficiency: 76 },
        afterState: { campusEfficiency: 80, surgeAbsorptionRate: '100%' },
        recommendation: 'Greenlight visiting cohort allocation into Block C and Innovation Hub.'
      };
    }

    // Default Wi-Fi Network Outage
    return {
      scenarioId: 'wifi_outage',
      title: 'What-If: Floor 2 Core Wi-Fi Backbone Fails Completely',
      impactSummary: 'Simulates complete failover when Block B Floor 2 access points drop connection.',
      affectedBuildings: ['BLD-B'],
      highlightCoordinates: [11.0261, 76.9056],
      metrics: {
        affectedAccessPoints: 4,
        connectedDevicesAtRisk: 280,
        secondaryMeshFailoverTime: '45 seconds'
      },
      mitigationPlan: [
        'Autonomous beamforming failover to Block B Floor 3 and Floor 1 ceiling antennas.',
        'Prioritize academic examination packets over general multimedia streaming.',
        'SMS alert dispatched to Senior Network Engineer with exact IDF rack coordinates.'
      ],
      beforeState: { networkAvailability: '98%' },
      afterState: { networkAvailability: '91%', failoverState: 'ACTIVE' },
      recommendation: 'Deploy secondary backup PoE injector to Floor 2 distribution box.'
    };
  }

  // Generate dynamic explainable AI insights for a selected building
  generateBuildingAIInsight(buildingId) {
    const building = this.masterBuildings.find(b => b.id === buildingId || b.code === buildingId);
    if (!building) {
      return {
        buildingId,
        title: 'Campus Central AI Telemetry',
        observation: 'Campus operations running within nominal thresholds.',
        why: ['Sensors reporting stable environmental and timetable conditions'],
        recommendedAction: 'Continue scheduled monitoring.'
      };
    }

    return {
      buildingId: building.id,
      buildingName: building.name,
      operationalStatus: building.operationalStatus,
      timeUtilization: building.timeUtilization,
      observation: building.aiInsightSummary,
      why: building.aiWhy,
      recommendedAction: building.aiRecommendedAction,
      confidence: 94
    };
  }

  // Filter sensitive data based on user role (Student privacy protection)
  filterByRole(buildings, role) {
    if (role === 'student') {
      return buildings.map(b => {
        const { contactEmail, inCharge, criticalIssuesCount, ...studentSafe } = b;
        return {
          ...studentSafe,
          studentSafeNotes: 'Student accessible facility with digital helpdesk access.'
        };
      });
    }
    return buildings;
  }
}

module.exports = new CampusMapService();
