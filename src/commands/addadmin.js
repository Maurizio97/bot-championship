const adminService = require('../services/adminService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { assertDiscordTag } = require('../utils/validators');

module.exports = {
  name: 'addadmin',
  description: 'Aggiunge un nuovo amministratore',
  usage: '&addadmin <@utente> <role>',
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length !== 2) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const discordId = assertDiscordTag(args[0], 'discordTag');
    const role = String(args[1] || '').trim().toLowerCase();

    const admin = await adminService.addAdmin({ discordId, role });

    const embed = successEmbed('Admin aggiunto', 'Nuovo amministratore registrato con successo.', [
      { name: 'Discord', value: admin.discord_id, inline: true },
      { name: 'Role', value: admin.role, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

