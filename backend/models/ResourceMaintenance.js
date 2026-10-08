const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceMaintenance = sequelize.define('ResourceMaintenance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maintenanceType: {
    type: DataTypes.STRING,
    allowNull: false // Routine Service, Firmware/OS Upgrade, HVAC Servicing, Hardware Repair
  },
  startDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "13:00"
  },
  endDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "15:00"
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'scheduled' // scheduled, in_progress, completed
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  technician: {
    type: DataTypes.STRING,
    defaultValue: 'Campus Facilities Engineering Team'
  }
}, {
  timestamps: true,
  tableName: 'resource_maintenance'
});

module.exports = ResourceMaintenance;
