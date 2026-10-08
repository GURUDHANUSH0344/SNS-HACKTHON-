const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeAIAnalysis = sequelize.define('CodeAIAnalysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  analysisType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  promptContext: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  result: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'code_ai_analyses',
  timestamps: true,
  underscored: true
});

module.exports = CodeAIAnalysis;
