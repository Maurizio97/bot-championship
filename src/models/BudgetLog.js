const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class BudgetLog extends Model {}

BudgetLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('ADD', 'REMOVE', 'DRAFT_PURCHASE', 'MARKET_PURCHASE'),
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    created_by_admin_id: {
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
    modelName: 'budget_logs',
    tableName: 'budget_logs',
    updatedAt: false,
    timestamps: true
  }
);

module.exports = BudgetLog;

