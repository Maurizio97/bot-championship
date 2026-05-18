const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'assegna',
  description: 'Assegna un giocatore svincolato alla squadra del turno corrente (solo staff)',
  usage: 'assegna <nomeGiocatore|playerId>',
  category: 'Draft',
  adminOnly: true,
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const result = await draftService.staffPickPlayer({
      playerIdentifier,
      adminId: admin.id
    });

    const nextTeamLabel = result.nextEntry?.team
      ? formatTeamLabel(result.nextEntry.team)
      : result.nextEntry?.discord_user_id || 'N/A';

    const embed = successEmbed('Scelta staff registrata', 'Giocatore assegnato alla squadra del turno corrente.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Squadra turno', value: formatTeamLabel(result.team), inline: true },
      { name: 'Costo', value: String(result.spent), inline: true },
      { name: 'Budget residuo', value: String(result.remainingBudget), inline: true },
      { name: 'Round attuale', value: String(result.state.current_round), inline: true },
      { name: 'Tocca a', value: nextTeamLabel, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


