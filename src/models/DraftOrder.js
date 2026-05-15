const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class DraftOrder extends Model {}

DraftOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('TEAM_SELECTION', 'PLAYER_DRAFT'),
      allowNull: false
    },
    discord_user_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    }
  },
  {
    sequelize,
    modelName: 'draft_orders',
    tableName: 'draft_orders',
    updatedAt: false,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['type', 'position']
      }
    ]
  }
);

module.exports = DraftOrder;

