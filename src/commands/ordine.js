const draftService = require('../services/draftService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'ordine',
  description: 'Mostra ordine draft completo',
  usage: 'ordine',
  category: 'Info',
  adminOnly: false,
  async execute(message) {
    const order = await draftService.getDraftOrder();
    const text = order.length
      ? order.map((item) => `${item.position + 1}. ${item.team ? formatTeamLabel(item.team) : item.discord_user_id}`).join('\n')
      : 'Ordine draft non disponibile.';

    const embed = successEmbed('Ordine draft', text.slice(0, 4096));
    await message.reply({ embeds: [embed] });
  }
};

