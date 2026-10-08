const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LearningPath = sequelize.define('LearningPath', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weakTopic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  goal: {
    type: DataTypes.STRING,
    defaultValue: 'Master core concepts and ace upcoming assessments'
  },
  scheduleJson: {
    type: DataTypes.TEXT, // JSON array of 7 days: [{day: 1, title, task, studyRecommendation, practiceActivity, completed: false}]
    allowNull: false
  },
  progressPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'Archived'),
    defaultValue: 'Active'
  }
}, {
  timestamps: true,
  tableName: 'learning_paths'
});

module.exports = LearningPath;
