const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampusBuilding = sequelize.define('CampusBuilding', {
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
  shortName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'Academic' // Academic, Administrative, Facility, Residential, Recreation, Services
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'Campus Administration'
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  floors: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 500
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Operational' // Operational, Maintenance, High Congestion, Restricted
  },
  utilization: {
    type: DataTypes.FLOAT,
    defaultValue: 70.0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  inCharge: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inChargeContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  polygonJson: {
    type: DataTypes.TEXT, // JSON array of [lat, lng] boundary vertices
    allowNull: true
  },
  floorsDataJson: {
    type: DataTypes.TEXT, // JSON structure of floors, rooms, and facilities
    allowNull: true
  },
  tagsJson: {
    type: DataTypes.TEXT, // JSON array of search tags
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'campus_buildings'
});

module.exports = CampusBuilding;
