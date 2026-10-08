const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProblemStatusHistory = sequelize.define('ProblemStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  problemId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previousStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  changedByName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'problem_status_histories'
});

module.exports = ProblemStatusHistory;
