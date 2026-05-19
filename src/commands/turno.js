const draftService = require('../services/draftService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

const STATUS_LABEL = {
  ACTIVE: '✅ Attivo',
  PAUSED: '⏸️ In pausa',
  CLOSED: '🔒 Chiuso'
};

module.exports = {
  name: 'turno',
  description: 'Mostra turno draft corrente',
  usage: 'turno',
  category: 'Draft',
  adminOnly: false,
  async execute(message) {
    const { state, currentEntry } = await draftService.getCurrentTurnInfo();

    const embed = successEmbed('Turno draft', 'Stato corrente del draft persistito in DB.', [
      { name: 'Stato', value: STATUS_LABEL[state.draft_status] || state.draft_status, inline: true },
      { name: 'Round', value: String(state.current_round), inline: true },
      { name: 'Posizione turno', value: String(state.current_draft_turn + 1), inline: true },
      { name: 'Squadra di turno', value: currentEntry?.team ? formatTeamLabel(currentEntry.team) : 'N/A', inline: false }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

