const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  facultyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'Unit 1'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  maxScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    defaultValue: 'Medium'
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'assignments'
});

module.exports = Assignment;
