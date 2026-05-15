const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');
const { DEFAULT_TEAM_BUDGET } = require('../config/constants');

class Team extends Model {}

Team.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    owner_discord_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    budget: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: DEFAULT_TEAM_BUDGET,
      validate: {
        min: 0
      }
    },
    selected_club_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
      unique: true,
      validate: {
        len: [2, 120]
      }
    }
  },
  {
    sequelize,
    modelName: 'teams',
    tableName: 'teams',
    timestamps: true
  }
);

module.exports = Team;

