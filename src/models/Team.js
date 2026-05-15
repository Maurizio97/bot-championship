const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

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
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    budget: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 100000000,
      validate: {
        min: 0
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

