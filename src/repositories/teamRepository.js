const { Team } = require('../models');

async function findByName(name) {
  return Team.findOne({ where: { name } });
}

async function findById(id) {
  return Team.findByPk(id);
}

async function createTeam(data) {
  return Team.create(data);
}

module.exports = {
  findByName,
  findById,
  createTeam
};

