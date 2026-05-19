const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'saltaturno',
  aliases: ['skipturn'],
  description: 'Salta il turno corrente del draft (solo admin)',
  usage: 'saltaturno',
  category: 'Draft',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);

    const { state, order } = await draftService.skipTurn();

    const currentEntry = order[state.current_draft_turn] || null;
    const nextTeamLabel = currentEntry?.team
      ? formatTeamLabel(currentEntry.team)
      : currentEntry?.discord_user_id || 'N/A';

    const embed = successEmbed('Turno saltato', 'Il turno e stato saltato. Tocca alla squadra successiva.', [
      { name: 'Round attuale', value: String(state.current_round), inline: true },
      { name: 'Posizione turno', value: String(state.current_draft_turn + 1), inline: true },
      { name: 'Tocca ora a', value: nextTeamLabel, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

