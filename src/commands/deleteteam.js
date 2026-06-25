const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { assertPositiveInteger } = require('../utils/validators');

module.exports = {
  name: 'deleteteam',
  aliases: ['removeteam', 'eliminateam'],
  description: 'Elimina una squadra registrata',
  usage: 'deleteteam <teamId>',
  category: 'Gestione Team',
  adminOnly: true,
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length !== 1) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const teamId = assertPositiveInteger(args[0], 'teamId');
    const removedTeam = await teamService.deleteTeamById(teamId);

    const embed = successEmbed('Squadra eliminata', 'La squadra e stata eliminata con successo.', [
      { name: 'Team ID', value: String(removedTeam.id), inline: true },
      { name: 'Squadra', value: formatTeamLabel(removedTeam), inline: true }
    ]);
    await message.reply({ embeds: [embed] });
  }
};
