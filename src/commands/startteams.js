const teamSelectionService = require('../services/teamSelectionService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'startteams',
  description: 'Avvia fase scelta squadre FC',
  usage: '&startteams',
  async execute(message) {
    await ensureAdminByMessage(message);

    const result = await teamSelectionService.startTeamSelection();
    const orderLabel = result.order.map((item) => `${item.position + 1}. ${item.discord_user_id}`).join('\n');

    const embed = successEmbed('Team selection avviata', 'Ordine casuale salvato in modo persistente.', [
      { name: 'Ordine', value: orderLabel.slice(0, 1024) || 'N/A' }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

