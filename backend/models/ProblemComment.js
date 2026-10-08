const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProblemComment = sequelize.define('ProblemComment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  problemId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorRole: {
    type: DataTypes.STRING,
    defaultValue: 'student'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'problem_comments'
});

module.exports = ProblemComment;
