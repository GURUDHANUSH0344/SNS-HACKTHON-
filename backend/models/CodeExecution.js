const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeExecution = sequelize.define('CodeExecution', {
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
  language: {
    type: DataTypes.STRING,
    allowNull: false
  },
  executionTime: {
    type: DataTypes.DECIMAL(8, 3),
    defaultValue: 0
  },
  exitCode: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'completed'
  },
  stdout: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  stderr: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'code_executions',
  timestamps: true,
  underscored: true
});

module.exports = CodeExecution;
