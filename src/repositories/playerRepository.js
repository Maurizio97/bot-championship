const { Op, fn, col, where } = require('sequelize');
const { Player, Team } = require('../models');

async function findById(id) {
  return Player.findByPk(id);
}

async function findByIdForUpdate(id, transaction) {
  return Player.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function findByName(term, limit = 10) {
  const normalized = String(term || '').trim().toLowerCase();

  return Player.findAll({
    where: where(fn('LOWER', col('player_name')), {
      [Op.like]: `%${normalized}%`
    }),
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
    ],
    limit
  });
}

async function save(player, options = {}) {
  return player.save(options);
}

async function findByExactName(term) {
  const normalized = String(term || '').trim().toLowerCase();

  return Player.findOne({
    where: where(fn('LOWER', col('player_name')), {
      [Op.eq]: normalized
    }),
    include: [
      {
        model: Team,
        as: 'team',
        required: false
      }
    ]
  });
}

module.exports = {
  findById,
  findByIdForUpdate,
  findByName,
  findByExactName,
  save
};

