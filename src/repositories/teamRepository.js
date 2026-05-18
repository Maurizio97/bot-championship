const { Op, fn, col, where } = require('sequelize');
const { Team } = require('../models');
const { Player } = require('../models');

async function findByName(name) {
  return Team.findOne({ where: { name } });
}

async function findById(id) {
  return Team.findByPk(id);
}

async function findByIdForUpdate(id, transaction) {
  return Team.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function findByOwnerDiscordId(ownerDiscordId) {
  return Team.findOne({ where: { owner_discord_id: ownerDiscordId } });
}

async function findByOwnerDiscordCandidates(candidates, options = {}) {
  const normalizedCandidates = (Array.isArray(candidates) ? candidates : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (normalizedCandidates.length === 0) {
    return null;
  }

  return Team.findOne({
    where: {
      owner_discord_id: {
        [Op.in]: normalizedCandidates
      }
    },
    ...options
  });
}

async function findAllOrdered() {
  return Team.findAll({
    order: [['name', 'ASC']]
  });
}

async function findByNameInsensitive(name, options = {}) {
  const normalized = String(name || '').trim().toLowerCase();
  return Team.findOne({
    where: where(fn('LOWER', col('name')), {
      [Op.eq]: normalized
    }),
    ...options
  });
}

async function findByNameOrOwnerCandidates(nameOrIdentifier, ownerCandidates = [], options = {}) {
  const normalizedName = String(nameOrIdentifier || '').trim();
  if (!normalizedName) {
    return null;
  }

  const byName = await findByNameInsensitive(normalizedName, options);
  if (byName) {
    return byName;
  }

  return findByOwnerDiscordCandidates(ownerCandidates, options);
}

async function createTeam(data) {
  return Team.create(data);
}

async function save(team, options = {}) {
  return team.save(options);
}

async function findAllWithPlayers() {
  return Team.findAll({
    include: [
      {
        model: Player,
        as: 'players'
      }
    ],
    order: [
      ['name', 'ASC'],
      [{ model: Player, as: 'players' }, 'overall', 'DESC'],
      [{ model: Player, as: 'players' }, 'player_name', 'ASC']
    ]
  });
}

module.exports = {
  findByName,
  findById,
  findByIdForUpdate,
  findByOwnerDiscordId,
  findByOwnerDiscordCandidates,
  findAllOrdered,
  findByNameInsensitive,
  findByNameOrOwnerCandidates,
  createTeam,
  save,
  findAllWithPlayers
};

