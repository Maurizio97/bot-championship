const { sequelize } = require('../models');

async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
}

module.exports = { initDatabase };

