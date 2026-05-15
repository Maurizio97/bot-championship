const { Admin } = require('../models');

async function findByDiscordId(discordId) {
  return Admin.findOne({ where: { discord_id: discordId } });
}

module.exports = {
  findByDiscordId
};

