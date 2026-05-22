const teamSelectionService = require('../services/teamSelectionService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'stopteams',
  description: 'Mette in pausa la scelta squadre',
  usage: '&stopteams',
  async execute(message) {
    await ensureAdminByMessage(message);
    const state = await teamSelectionService.stopTeamSelection();

    const embed = successEmbed('Team selection in pausa', 'Turno e ordine restano salvati.', [
      { name: 'Turno corrente', value: String(state.current_team_selection_turn), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

