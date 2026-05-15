const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'continua',
  description: 'Riprende il draft dalla posizione persistita',
  usage: '&continua',
  async execute(message) {
    await ensureAdminByMessage(message);
    const state = await draftService.continueDraft();

    const embed = successEmbed('Draft ripreso', 'Ripresa completata dal turno salvato.', [
      { name: 'Round', value: String(state.current_round), inline: true },
      { name: 'Turno', value: String(state.current_draft_turn), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

