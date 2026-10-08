const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admission = sequelize.define('Admission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  applicationNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  marksPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 85.0
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'admissions'
});

module.exports = Admission;
