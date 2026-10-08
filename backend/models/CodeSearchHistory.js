const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeSearchHistory = sequelize.define('CodeSearchHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'python'
  },
  difficulty: {
    type: DataTypes.STRING,
    defaultValue: 'beginner'
  },
  generatedCode: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'code_search_history',
  timestamps: true,
  underscored: true
});

module.exports = CodeSearchHistory;
