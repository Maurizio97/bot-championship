const draftService = require('../services/draftService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'turno',
  description: 'Mostra turno draft corrente',
  usage: 'turno',
  category: 'Info',
  adminOnly: false,
  async execute(message) {
    const { state, currentEntry } = await draftService.getCurrentTurnInfo();

    const embed = successEmbed('Turno draft', 'Stato corrente del draft persistito in DB.', [
      { name: 'Round', value: String(state.current_round), inline: true },
      { name: 'Posizione turno', value: String(state.current_draft_turn + 1), inline: true },
      { name: 'Squadra', value: currentEntry?.team ? formatTeamLabel(currentEntry.team) : 'N/A', inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

