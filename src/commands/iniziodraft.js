const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'iniziodraft',
  description: 'Avvia draft giocatori con nuovo ordine casuale',
  usage: '&iniziodraft',
  async execute(message) {
    await ensureAdminByMessage(message);

    const result = await draftService.startDraft();
    const orderLabel = result.order.map((item) => `${item.position + 1}. ${item.team?.name || item.discord_user_id}`).join('\n');

    const embed = successEmbed('Draft avviato', 'Nuovo ordine randomico persistito.', [
      { name: 'Round', value: String(result.state.current_round), inline: true },
      { name: 'Turno', value: String(result.state.current_draft_turn), inline: true },
      { name: 'Ordine', value: orderLabel.slice(0, 1024) || 'N/A', inline: false }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

