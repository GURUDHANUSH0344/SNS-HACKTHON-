const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
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
  department: {
    type: DataTypes.STRING,
    defaultValue: 'Computer Science & Engineering'
  },
  semester: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'subjects'
});

module.exports = Subject;
