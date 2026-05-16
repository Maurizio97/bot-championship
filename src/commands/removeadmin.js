const adminService = require('../services/adminService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { assertDiscordTag } = require('../utils/validators');

module.exports = {
  name: 'removeadmin',
  description: 'Rimuove un amministratore',
  usage: 'removeadmin <@utente>',
  category: 'Gestione Staff',
  adminOnly: true,
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length !== 1) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const discordId = assertDiscordTag(args[0], 'discordTag');
    const removed = await adminService.removeAdmin({ discordId });

    const embed = successEmbed('Admin rimosso', `Amministratore ${removed.discord_id} rimosso.`, [
      { name: 'Role precedente', value: removed.role, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

