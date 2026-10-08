const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampusProblem = sequelize.define('CampusProblem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporterName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reporterEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Infrastructure'
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  building: {
    type: DataTypes.STRING,
    defaultValue: 'Main Academic Block'
  },
  block: {
    type: DataTypes.STRING,
    defaultValue: 'A'
  },
  floor: {
    type: DataTypes.STRING,
    defaultValue: '2nd Floor'
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  },
  locationDescription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Verified', 'Escalated', 'Closed'),
    defaultValue: 'Open'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assignedStaffId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  attachmentUrlsJson: {
    type: DataTypes.TEXT, // JSON array of uploaded media URLs
    allowNull: true
  },
  resolutionSummary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolutionProofUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  escalatedReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'campus_problems'
});

module.exports = CampusProblem;
