const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'salta',
  description: 'Salta il turno draft corrente',
  usage: '&salta',
  async execute(message) {
    await ensureAdminByMessage(message);
    const result = await draftService.skipTurn();

    const nextEntry = result.order[result.state.current_draft_turn];
    const nextLabel = nextEntry ? `${nextEntry.position + 1} - ${nextEntry.discord_user_id}` : 'N/A';

    const embed = successEmbed('Turno saltato', 'Turno avanzato rispettando logica round ciclica.', [
      { name: 'Round corrente', value: String(result.state.current_round), inline: true },
      { name: 'Turno corrente', value: String(result.state.current_draft_turn), inline: true },
      { name: 'Prossimo', value: nextLabel, inline: false }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

