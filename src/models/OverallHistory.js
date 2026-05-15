const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class OverallHistory extends Model {}

OverallHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'players',
        key: 'id'
      }
    },
    old_overall: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 99
      }
    },
    new_overall: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 99
      }
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    updated_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'overall_history',
    tableName: 'overall_history',
    updatedAt: false,
    timestamps: true
  }
);

module.exports = OverallHistory;

