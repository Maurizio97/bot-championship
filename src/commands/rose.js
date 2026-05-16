const teamService = require('../services/teamService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'rose',
  description: 'Mostra l\'elenco di tutte le rose disponibili',
  usage: '&rose',
  async execute(message) {
    const teams = await teamService.listTeamRosters();

    if (teams.length === 0) {
      const embed = successEmbed('Rose disponibili', 'Nessuna squadra registrata al momento.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const fields = teams.slice(0, 25).map((team) => {
      const players = team.players || [];
      const roster = players.length
        ? players.map((p) => `${p.player_name} (${p.overall})`).join(', ')
        : 'Nessun giocatore assegnato';

      return {
        name: `${formatTeamLabel(team)} (ID ${team.id})`,
        value: roster.slice(0, 1024)
      };
    });

    const extraTeams = teams.length - fields.length;
    const description = extraTeams > 0
      ? `Mostrate le prime ${fields.length} squadre. Altre ${extraTeams} non visualizzate.`
      : 'Elenco completo delle rose disponibili.';

    const embed = successEmbed('Rose disponibili', description, fields);
    await message.reply({ embeds: [embed] });
  }
};

