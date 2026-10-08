const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacultyProfile = sequelize.define('FacultyProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  employeeId: {
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
  designation: {
    type: DataTypes.STRING,
    defaultValue: 'Associate Professor'
  },
  qualification: {
    type: DataTypes.STRING,
    defaultValue: 'Ph.D. in Artificial Intelligence'
  },
  specialization: {
    type: DataTypes.STRING,
    defaultValue: 'Machine Learning, Data Engineering'
  },
  officeLocation: {
    type: DataTypes.STRING,
    defaultValue: 'Tech Block B, Room 304'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'faculty_profiles'
});

module.exports = FacultyProfile;
