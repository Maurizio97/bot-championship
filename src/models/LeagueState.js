const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class LeagueState extends Model {}

LeagueState.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    draft_status: {
      type: DataTypes.ENUM('CLOSED', 'ACTIVE', 'PAUSED'),
      allowNull: false,
      defaultValue: 'CLOSED'
    },
    market_status: {
      type: DataTypes.ENUM('CLOSED', 'OPEN'),
      allowNull: false,
      defaultValue: 'CLOSED'
    },
    team_selection_status: {
      type: DataTypes.ENUM('CLOSED', 'ACTIVE', 'PAUSED'),
      allowNull: false,
      defaultValue: 'CLOSED'
    },
    current_draft_turn: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    current_team_selection_turn: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    current_round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    current_season_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    }
  },
  {
    sequelize,
    modelName: 'league_state',
    tableName: 'league_state',
    timestamps: true
  }
);

module.exports = LeagueState;

