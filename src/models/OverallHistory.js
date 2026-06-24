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
    season_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    old_age: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    new_age: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    old_price: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    new_price: {
      type: DataTypes.BIGINT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    growth_applied: {
      type: DataTypes.SMALLINT,
      allowNull: true
    },
    goals: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    assists: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    updated_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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

