const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampusEntity = sequelize.define('CampusEntity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Laboratory', 'Building', 'Auditorium', 'Library', 'Hostel', 'Cafeteria', 'Sports', 'Admin Office'),
    defaultValue: 'Laboratory'
  },
  block: {
    type: DataTypes.STRING,
    allowNull: false
  },
  floor: {
    type: DataTypes.STRING,
    defaultValue: 'Ground Floor'
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  inCharge: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  operatingHours: {
    type: DataTypes.STRING,
    defaultValue: '8:30 AM - 5:30 PM'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tagsJson: {
    type: DataTypes.TEXT, // JSON array of string tags
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'campus_entities'
});

module.exports = CampusEntity;
