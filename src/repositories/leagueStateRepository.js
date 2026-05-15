const { LeagueState } = require('../models');

const SINGLETON_ID = 1;

async function ensureSingleton(options = {}) {
  const existing = await LeagueState.findByPk(SINGLETON_ID, options);
  if (existing) {
    return existing;
  }

  return LeagueState.create(
    {
      id: SINGLETON_ID
    },
    options
  );
}

async function getForUpdate(transaction) {
  await ensureSingleton({ transaction });
  return LeagueState.findByPk(SINGLETON_ID, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function getSingleton(options = {}) {
  return ensureSingleton(options);
}

module.exports = {
  SINGLETON_ID,
  ensureSingleton,
  getForUpdate,
  getSingleton
};

