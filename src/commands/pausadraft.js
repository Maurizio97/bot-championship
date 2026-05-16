const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'pausadraft',
  description: 'Mette in pausa il draft giocatori',
  usage: 'pausadraft',
  category: 'Draft',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);
    const state = await draftService.stopDraft();

    const embed = successEmbed('Draft in pausa', 'Il draft è stato messo in pausa.', [
      { name: 'Round', value: String(state.current_round), inline: true },
      { name: 'Turno', value: String(state.current_draft_turn), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


