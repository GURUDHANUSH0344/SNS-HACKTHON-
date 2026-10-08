const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIReport = sequelize.define('AIReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reportType: {
    type: DataTypes.STRING,
    defaultValue: 'Institutional Comprehensive'
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'All Departments'
  },
  semester: {
    type: DataTypes.STRING,
    defaultValue: 'Odd Semester 2026'
  },
  metricsJson: {
    type: DataTypes.TEXT, // Key-value metrics
    allowNull: true
  },
  insightsJson: {
    type: DataTypes.TEXT, // AI extracted insights
    allowNull: true
  },
  recommendationsJson: {
    type: DataTypes.TEXT, // Actionable recommendations
    allowNull: true
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'ai_reports'
});

module.exports = AIReport;
