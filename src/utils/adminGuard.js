const { hasDiscordAdminRole } = require('./discordRoleGuard');
const { ForbiddenError } = require('./errors');

/**
 * Verifica che l'utente abbia il ruolo admin Discord.
 * Lancia ForbiddenError se non autorizzato.
 */
async function ensureAdminByMessage(message) {
  if (!hasDiscordAdminRole(message)) {
    throw new ForbiddenError('🔐 Questo comando richiede il ruolo admin Discord.');
  }
  // Ritorna oggetto minimale per retrocompatibilità
  return { discord_id: message.author.id };
}

module.exports = {
  ensureAdminByMessage
};

