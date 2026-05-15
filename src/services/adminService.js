const adminRepository = require('../repositories/adminRepository');
const { ForbiddenError } = require('../utils/errors');

async function getAdminByDiscordId(discordId) {
  return adminRepository.findByDiscordId(discordId);
}

async function ensureAdmin(discordId) {
  const admin = await getAdminByDiscordId(discordId);

  if (!admin) {
    throw new ForbiddenError('Non hai i permessi admin per usare questo comando.');
  }

  return admin;
}

module.exports = {
  getAdminByDiscordId,
  ensureAdmin
};

