const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceRecommendation = sequelize.define('ResourceRecommendation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetResourceId: {
    type: DataTypes.INTEGER,
    allowNull: true // For swap/reallocation recommendations
  },
  recommendationType: {
    type: DataTypes.STRING,
    allowNull: false // underutilization, overload, swap, conflict_resolution, maintenance_reroute
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  problem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  evidence: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  impact: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  action: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expectedImprovement: {
    type: DataTypes.STRING,
    allowNull: true
  },
  confidence: {
    type: DataTypes.INTEGER,
    defaultValue: 90 // e.g. 92%
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending, simulated, approved, rejected
  },
  beforeMetrics: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON string of metrics
  },
  afterMetrics: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON string of metrics
  },
  scoreBreakdown: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON string of score factors
  }
}, {
  timestamps: true,
  tableName: 'resource_recommendations'
});

module.exports = ResourceRecommendation;
