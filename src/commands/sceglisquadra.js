const teamSelectionService = require('../services/teamSelectionService');
const { successEmbed } = require('../utils/embedFactory');
const { getDiscordIdentityCandidates } = require('../utils/discordIdentity');

module.exports = {
  name: 'sceglisquadra',
  description: 'Sceglie il club FC nel tuo turno team selection',
  usage: '&sceglisquadra <nomeClub>',
  async execute(message, args) {
    const clubName = args.join(' ').trim();
    if (!clubName) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const candidates = getDiscordIdentityCandidates(message.author);
    const result = await teamSelectionService.selectClub({
      discordUserId: message.author.id,
      discordUserCandidates: candidates,
      clubName
    });

    const nextTurnLabel = result.nextEntry
      ? `${result.nextEntry.position + 1} - ${result.nextEntry.discord_user_id}`
      : 'Fase completata';

    const embed = successEmbed('Club selezionato', 'Scelta registrata con successo.', [
      { name: 'Squadra manager', value: result.team.name, inline: true },
      { name: 'Club FC', value: result.clubName, inline: true },
      { name: 'Prossimo turno', value: nextTurnLabel, inline: false }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

