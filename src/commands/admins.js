const adminService = require('../services/adminService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatDiscordIdentity } = require('../utils/discordIdentity');

module.exports = {
  name: 'admins',
  description: 'Mostra elenco amministratori',
  usage: '&admins',
  category: 'Gestione Staff',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);

    const admins = await adminService.listAdmins();
    const description = admins.length
      ? admins.map((admin) => `- ${formatDiscordIdentity(admin.discord_id)} (${admin.role})`).join('\n')
      : 'Nessun admin registrato.';

    const embed = successEmbed('Amministratori', description);
    await message.reply({ embeds: [embed] });
  }
};

