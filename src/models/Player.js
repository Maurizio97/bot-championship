const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class Player extends Model {}

Player.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    player_name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 120]
      }
    },
    overall: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 99
      }
    },
    potential_overall: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 99
      }
    },
    role: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'players',
    tableName: 'players',
    timestamps: true
  }
);

module.exports = Player;

