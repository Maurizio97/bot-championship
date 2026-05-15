const { Team } = require('../models');
const { Player } = require('../models');

async function findByName(name) {
  return Team.findOne({ where: { name } });
}

async function findById(id) {
  return Team.findByPk(id);
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
  createTeam,
  save,
  findAllWithPlayers
};

