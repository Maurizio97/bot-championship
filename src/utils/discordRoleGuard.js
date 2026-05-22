const env = require('../config/env');

/**
 * Controlla se l'autore del messaggio ha il ruolo Discord admin.
 * Se DISCORD_ADMIN_ROLE_ID non è configurato, ritorna true (nessun controllo).
 * Supporta sia ID numerico che nome del ruolo.
 * @param {Discord.Message} message
 * @returns {boolean}
 */
function hasDiscordAdminRole(message) {
  // Se ruolo non configurato, skip check (backward compatibility)
  if (!env.discordAdminRoleId) {
    return true;
  }

  // Se messaggio non è in guild, denegar accesso
  if (!message.guild || !message.member) {
    return false;
  }

  const roleIdentifier = env.discordAdminRoleId.trim();

  // Se è un ID numerico (snowflake), controlla per ID
  if (/^\d+$/.test(roleIdentifier)) {
    return message.member.roles.cache.has(roleIdentifier);
  }

  // Altrimenti controlla per nome del ruolo (case-insensitive)
  return message.member.roles.cache.some(
    (role) => role.name.toLowerCase() === roleIdentifier.toLowerCase()
  );
}

module.exports = {
  hasDiscordAdminRole
};

