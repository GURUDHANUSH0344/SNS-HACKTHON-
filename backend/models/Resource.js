const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Academic Space' // Academic Space, Equipment, People, Facilities
  },
  building: {
    type: DataTypes.STRING,
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 40
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'General'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Available' // Available, Booked, Maintenance, Unavailable
  },
  utilizationStatus: {
    type: DataTypes.STRING,
    defaultValue: 'OPTIMALLY UTILIZED' // UNDERUTILIZED, OPTIMALLY UTILIZED, HIGH UTILIZATION, OVERLOADED, UNAVAILABLE, MAINTENANCE
  },
  operatingHours: {
    type: DataTypes.STRING,
    defaultValue: '08:30–17:00'
  },
  operatingStart: {
    type: DataTypes.STRING,
    defaultValue: '08:30'
  },
  operatingEnd: {
    type: DataTypes.STRING,
    defaultValue: '17:00'
  },
  maintenanceStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Normal' // Normal, Scheduled, Under Maintenance
  },
  timeUtilization: {
    type: DataTypes.FLOAT,
    defaultValue: 50.0 // Actual Usage Time / Available Time * 100
  },
  capacityUtilization: {
    type: DataTypes.FLOAT,
    defaultValue: 50.0 // Occupied Capacity / Total Capacity * 100
  },
  averageOccupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  weeklyAvailableHours: {
    type: DataTypes.FLOAT,
    defaultValue: 40.0
  },
  weeklyUsedHours: {
    type: DataTypes.FLOAT,
    defaultValue: 20.0
  },
  weeklyUnusedHours: {
    type: DataTypes.FLOAT,
    defaultValue: 20.0
  },
  peakUsageWindow: {
    type: DataTypes.STRING,
    defaultValue: '10:00–12:00'
  },
  lowUsageWindow: {
    type: DataTypes.STRING,
    defaultValue: '14:00–16:00'
  },
  equipmentSpecs: {
    type: DataTypes.TEXT,
    defaultValue: '[]' // JSON array of equipment strings
  },
  responsibleDepartment: {
    type: DataTypes.STRING,
    defaultValue: 'Academic Operations'
  },
  healthScore: {
    type: DataTypes.INTEGER,
    defaultValue: 90
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'resources'
});

module.exports = Resource;
