const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentGamification = sequelize.define('StudentGamification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  totalXp: {
    type: DataTypes.INTEGER,
    defaultValue: 450
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  streakDays: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  lastActiveDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  badgesJson: {
    type: DataTypes.TEXT, // JSON array of earned badge objects [{id, title, icon, description, earnedAt}]
    allowNull: true
  },
  growthScore: {
    type: DataTypes.INTEGER,
    defaultValue: 86
  },
  academicConsistency: {
    type: DataTypes.INTEGER,
    defaultValue: 88
  },
  quizMastery: {
    type: DataTypes.INTEGER,
    defaultValue: 82
  },
  attendanceDiscipline: {
    type: DataTypes.INTEGER,
    defaultValue: 92
  },
  careerReadiness: {
    type: DataTypes.INTEGER,
    defaultValue: 79
  }
}, {
  timestamps: true,
  tableName: 'student_gamifications'
});

module.exports = StudentGamification;
