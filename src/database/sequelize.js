const { Sequelize } = require('sequelize');
const env = require('../config/env');

const commonOptions = {
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true
  }
};

const sequelize = env.db.databaseUrl
  ? new Sequelize(env.db.databaseUrl, {
      ...commonOptions,
      dialect: env.db.dialect
    })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...commonOptions,
      host: env.db.host,
      port: env.db.port,
      dialect: env.db.dialect
    });

module.exports = sequelize;

