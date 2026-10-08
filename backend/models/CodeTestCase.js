const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeTestCase = sequelize.define('CodeTestCase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  input: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  expectedOutput: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  actualOutput: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  }
}, {
  tableName: 'code_test_cases',
  timestamps: true,
  underscored: true
});

module.exports = CodeTestCase;
