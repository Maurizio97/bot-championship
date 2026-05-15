const teamSelectionService = require('../services/teamSelectionService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'continueteams',
  description: 'Riprende la scelta squadre dalla posizione salvata',
  usage: '&continueteams',
  async execute(message) {
    await ensureAdminByMessage(message);
    const state = await teamSelectionService.continueTeamSelection();

    const embed = successEmbed('Team selection ripresa', 'Ripresa dal turno persistito nel database.', [
      { name: 'Turno corrente', value: String(state.current_team_selection_turn), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

