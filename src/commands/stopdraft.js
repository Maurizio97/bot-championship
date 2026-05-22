const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'stopdraft',
  description: 'Mette in pausa draft giocatori',
  usage: '&stopdraft',
  async execute(message) {
    await ensureAdminByMessage(message);
    const state = await draftService.stopDraft();

    const embed = successEmbed('Draft in pausa', 'Ordine, turno e round restano invariati.', [
      { name: 'Round', value: String(state.current_round), inline: true },
      { name: 'Turno', value: String(state.current_draft_turn), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

