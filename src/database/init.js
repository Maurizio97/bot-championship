const { sequelize } = require('../models');
const leagueStateRepository = require('../repositories/leagueStateRepository');

async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await leagueStateRepository.ensureSingleton();
}

module.exports = { initDatabase };

