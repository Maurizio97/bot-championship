const teamService = require('../services/teamService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel, getDiscordIdentityCandidates } = require('../utils/discordIdentity');

function rosterToField(team) {
  const players = team.players || [];
  const roster = players.length
    ? players.map((player) => `${player.player_name} (${player.overall})`).join(', ')
    : 'Nessun giocatore assegnato';

  return {
    name: `Squadra (ID ${team.id})`,
    value: roster.slice(0, 1024)
  };
}

module.exports = {
  name: 'rosa',
  aliases: ['rose'],
  description: 'Mostra rosa tua o di una squadra specifica',
  usage: 'rosa [nomeSquadra]',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    if (args.length === 0) {
      const candidates = getDiscordIdentityCandidates(message.author);
      const ownTeam = await teamService.getTeamByOwnerCandidates(candidates);
      const team = await teamService.getRosterByTeamName(ownTeam.name);

      const embed = successEmbed('La tua rosa', `Dati squadra correnti: ${formatTeamLabel(team)}.`, [rosterToField(team)]);
      await message.reply({ embeds: [embed] });
      return;
    }

    const teamName = args.join(' ').trim();
    const team = await teamService.getRosterByTeamName(teamName);
    const embed = successEmbed('Rosa squadra', `Dettaglio rosa richiesta: ${formatTeamLabel(team)}.`, [rosterToField(team)]);
    await message.reply({ embeds: [embed] });
  }
};

