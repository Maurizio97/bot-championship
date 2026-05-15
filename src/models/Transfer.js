const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class Transfer extends Model {}

Transfer.init(
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
    from_team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    to_team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    created_by_admin_id: {
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
    modelName: 'transfers',
    tableName: 'transfers',
    updatedAt: false,
    timestamps: true
  }
);

module.exports = Transfer;

