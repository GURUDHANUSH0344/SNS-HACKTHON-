const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuestionPaper = sequelize.define('QuestionPaper', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  facultyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'Unit 1 & 2'
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard', 'Balanced'),
    defaultValue: 'Balanced'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 90
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  sectionsJson: {
    type: DataTypes.TEXT, // JSON array of sections: [{name: 'Part A', instruction: 'Answer all questions (5 x 2 = 10)', questions: [...]}]
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'question_papers'
});

module.exports = QuestionPaper;
