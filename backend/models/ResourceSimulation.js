const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResourceSimulation = sequelize.define('ResourceSimulation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  scenarioName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scenarioType: {
    type: DataTypes.STRING,
    allowNull: false // swap_redistribution, outage_mitigation, surge_capacity, maintenance_reroute
  },
  inputData: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON string
  },
  simulationResult: {
    type: DataTypes.TEXT,
    defaultValue: '{}' // JSON string
  },
  efficiencyBefore: {
    type: DataTypes.INTEGER,
    defaultValue: 76
  },
  efficiencyAfter: {
    type: DataTypes.INTEGER,
    defaultValue: 84
  },
  createdBy: {
    type: DataTypes.STRING,
    defaultValue: 'admin@campusai.edu'
  }
}, {
  timestamps: true,
  tableName: 'resource_simulations'
});

module.exports = ResourceSimulation;
