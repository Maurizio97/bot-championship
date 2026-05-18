const draftService = require('../services/draftService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel, getDiscordIdentityCandidates } = require('../utils/discordIdentity');

module.exports = {
  name: 'scegli',
  description: 'Seleziona un giocatore svincolato se e il tuo turno draft',
  usage: 'scegli <nomeGiocatore|playerId>',
  category: 'Draft',
  adminOnly: false,
  async execute(message, args) {
    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const result = await draftService.pickPlayer({
      discordUserId: message.author?.id,
      discordUserCandidates: getDiscordIdentityCandidates(message.author),
      playerIdentifier
    });

    const nextTeamLabel = result.nextEntry?.team
      ? formatTeamLabel(result.nextEntry.team)
      : result.nextEntry?.discord_user_id || 'N/A';

    const embed = successEmbed('Scelta registrata', 'Giocatore assegnato alla squadra di turno.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Squadra', value: formatTeamLabel(result.team), inline: true },
      { name: 'Costo', value: String(result.spent), inline: true },
      { name: 'Budget residuo', value: String(result.remainingBudget), inline: true },
      { name: 'Round attuale', value: String(result.state.current_round), inline: true },
      { name: 'Tocca a', value: nextTeamLabel, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

