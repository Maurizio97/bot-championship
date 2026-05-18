const { Player, Team } = require('../models');
const { normalizeSearchText } = require('../utils/textSearch');

async function findById(id) {
  return Player.findByPk(id);
}

async function findByIdForUpdate(id, transaction) {
  return Player.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

function buildPlayerListQuery() {
  return {
    include: [
      {
        model: Team,
        as: 'team',
        required: false
      }
    ],
    order: [
      ['player_name', 'ASC'],
      ['overall', 'DESC']
    ]
  };
}

async function findByName(term, limit = 10) {
  const normalized = normalizeSearchText(term);
  if (!normalized) {
    return [];
  }

  const players = await Player.findAll(buildPlayerListQuery());
  return players
    .filter((player) => normalizeSearchText(player.player_name).includes(normalized))
    .slice(0, limit);
}

async function save(player, options = {}) {
  return player.save(options);
}

async function findByExactName(term) {
  const normalized = normalizeSearchText(term);
  if (!normalized) {
    return null;
  }

  const players = await Player.findAll(buildPlayerListQuery());
  return players.find((player) => normalizeSearchText(player.player_name) === normalized) || null;
}

module.exports = {
  findById,
  findByIdForUpdate,
  findByName,
  findByExactName,
  save
};

