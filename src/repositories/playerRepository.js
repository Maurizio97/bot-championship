const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
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

async function findFreePlayers(options = {}) {
  const { role, limit = 20, offset = 0 } = options;

  const queryWhere = { team_id: null };
  if (role) {
    const normalizedRole = String(role).trim().toLowerCase();
    queryWhere[Op.and] = [
      sequelizeWhere(fn('LOWER', col('role')), {
        [Op.like]: `${normalizedRole}%`
      })
    ];
  }

  const { count, rows } = await Player.findAndCountAll({
    where: queryWhere,
    include: [
      {
        model: Team,
        as: 'team',
        required: false
      }
    ],
    order: [['overall', 'DESC']],
    limit,
    offset
  });

  return {
    players: rows,
    total: count,
    limit,
    offset,
    pages: Math.ceil(count / limit)
  };
}

async function findTakenPlayers(options = {}) {
  const { role, limit = 20, offset = 0 } = options;

  const queryWhere = { team_id: { [Op.ne]: null } };
  if (role) {
    const normalizedRole = String(role).trim().toLowerCase();
    queryWhere[Op.and] = [
      sequelizeWhere(fn('LOWER', col('role')), {
        [Op.like]: `${normalizedRole}%`
      })
    ];
  }

  const { count, rows } = await Player.findAndCountAll({
    where: queryWhere,
    include: [
      {
        model: Team,
        as: 'team',
        required: false
      }
    ],
    order: [['overall', 'DESC']],
    limit,
    offset
  });

  return {
    players: rows,
    total: count,
    limit,
    offset,
    pages: Math.ceil(count / limit)
  };
}

async function countByTeamId(teamId, options = {}) {
  return Player.count({
    where: { team_id: teamId },
    ...options
  });
}

module.exports = {
  findById,
  findByIdForUpdate,
  findByName,
  findByExactName,
  save,
  findFreePlayers,
  findTakenPlayers,
  countByTeamId
};
