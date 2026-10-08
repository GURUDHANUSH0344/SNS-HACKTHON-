const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceAllocationLog = sequelize.define('ResourceAllocationLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previousResourceId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actionType: {
    type: DataTypes.STRING,
    defaultValue: 'Reallocation' // Reallocation, Emergency Swap, Capacity Redistribution, Manual Assignment
  },
  bookingPurpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  approvedBy: {
    type: DataTypes.STRING,
    defaultValue: 'admin@campusai.edu'
  },
  aiRecommendationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  impactSummary: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'resource_allocation_logs'
});

module.exports = ResourceAllocationLog;
