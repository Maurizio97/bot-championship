const adminRepository = require('../repositories/adminRepository');
const { ForbiddenError } = require('../utils/errors');

async function getAdminByDiscordId(discordKey) {
  return adminRepository.findByDiscordId(discordKey);
}

async function ensureAdmin(discordKey) {
  const admin = await getAdminByDiscordId(discordKey);

  if (!admin) {
    throw new ForbiddenError('Non hai i permessi admin per usare questo comando.');
  }

  return admin;
}

module.exports = {
  getAdminByDiscordId,
  ensureAdmin
};

