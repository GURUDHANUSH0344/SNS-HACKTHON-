const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  percentage: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  answersJson: {
    type: DataTypes.TEXT, // JSON array of selected answers
    allowNull: true
  },
  weakTopicsJson: {
    type: DataTypes.TEXT, // JSON array of identified weak topics
    allowNull: true
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  xpEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'quiz_attempts'
});

module.exports = QuizAttempt;
