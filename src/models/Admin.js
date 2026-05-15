const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database/sequelize');

class Admin extends Model {}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    discord_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'admin'
    }
  },
  {
    sequelize,
    modelName: 'admins',
    tableName: 'admins',
    updatedAt: false,
    timestamps: true
  }
);

module.exports = Admin;

