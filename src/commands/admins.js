const adminService = require('../services/adminService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

function formatAdminIdentity(discordId) {
  const normalized = String(discordId || '').trim();
  if (/^\d{17,20}$/.test(normalized)) {
    return `<@${normalized}> (${normalized})`;
  }

  return `@${normalized}`;
}

module.exports = {
  name: 'admins',
  description: 'Mostra elenco amministratori',
  usage: '&admins',
  async execute(message) {
    await ensureAdminByMessage(message);

    const admins = await adminService.listAdmins();
    const description = admins.length
      ? admins.map((admin) => `- ${formatAdminIdentity(admin.discord_id)} (${admin.role})`).join('\n')
      : 'Nessun admin registrato.';

    const embed = successEmbed('Amministratori', description);
    await message.reply({ embeds: [embed] });
  }
};

