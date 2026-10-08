const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeSession = sequelize.define('CodeSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Algorithm'
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'python'
  },
  sourceCode: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  stdin: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  lastOutput: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  executionStatus: {
    type: DataTypes.STRING,
    defaultValue: 'idle'
  }
}, {
  tableName: 'code_sessions',
  timestamps: true,
  underscored: true
});

module.exports = CodeSession;
