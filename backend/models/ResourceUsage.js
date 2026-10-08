const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceUsage = sequelize.define('ResourceUsage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dayOfWeek: {
    type: DataTypes.STRING,
    defaultValue: 'Wednesday'
  },
  timeSlot: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"
  },
  occupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  utilizationPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'Automated IoT Sensor' // Automated IoT Sensor, RFID Check-in, Timetable Schedule
  }
}, {
  timestamps: true,
  tableName: 'resource_usage'
});

module.exports = ResourceUsage;
