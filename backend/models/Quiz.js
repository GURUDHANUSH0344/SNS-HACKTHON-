const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'Unit 1'
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    defaultValue: 'Medium'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  questionsJson: {
    type: DataTypes.TEXT, // JSON array of questions [{question, options:[], correctIndex, explanation, topic}]
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'quizzes'
});

module.exports = Quiz;
