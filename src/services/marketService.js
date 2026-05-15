const { sequelize } = require('../models');
const leagueStateRepository = require('../repositories/leagueStateRepository');

async function openMarket() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.market_status = 'OPEN';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log('[MARKET] opened');
    return state;
  });
}

async function closeMarket() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.market_status = 'CLOSED';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log('[MARKET] closed');
    return state;
  });
}

module.exports = {
  openMarket,
  closeMarket
};


