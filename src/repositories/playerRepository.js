const { Player } = require('../models');

async function findById(id) {
  return Player.findByPk(id);
}

async function save(player, options = {}) {
  return player.save(options);
}

module.exports = {
  findById,
  save
};

