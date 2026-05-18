const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'teams',
  aliases: ['squadre'],
  description: 'Mostra l\'elenco di tutte le squadre registrate',
  usage: 'teams',
  category: 'Gestione Team',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);

    const teams = await teamService.listTeams();

    if (teams.length === 0) {
      const embed = successEmbed('Elenco team', 'Nessuna squadra registrata al momento.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const rows = teams.map((team, index) => (
      `${index + 1}. ID ${team.id} - ${formatTeamLabel(team)} - Budget ${team.budget}`
    ));

    const description = [`Totale squadre: ${teams.length}`, '', ...rows].join('\n').slice(0, 4096);
    const embed = successEmbed('Elenco team', description);
    await message.reply({ embeds: [embed] });
  }
};

