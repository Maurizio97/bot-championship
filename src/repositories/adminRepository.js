const { Admin } = require('../models');

async function findByDiscordId(discordId) {
  return Admin.findOne({ where: { discord_id: discordId } });
}

async function findAll() {
  return Admin.findAll({
    order: [
      ['role', 'ASC'],
      ['discord_id', 'ASC']
    ]
  });
}

async function createAdmin(data, options = {}) {
  return Admin.create(data, options);
}

async function countByRole(role, options = {}) {
  return Admin.count({ where: { role }, ...options });
}

async function destroyById(id, options = {}) {
  return Admin.destroy({ where: { id }, ...options });
}

module.exports = {
  findByDiscordId,
  findAll,
  createAdmin,
  countByRole,
  destroyById
};

