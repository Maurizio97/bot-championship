const { DEFAULT_TEAM_BUDGET } = require('../config/constants');
const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { assertDiscordTag } = require('../utils/validators');

module.exports = {
  name: 'addteam',
  aliases: ['aggiungiteam'],
  description: 'Crea una nuova squadra',
  usage: 'addteam <nomeSquadra> <@owner>',
  category: 'Gestione Team',
  adminOnly: true,
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length < 2) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const rawOwnerDiscordId = args[args.length - 1];
    const name = args.slice(0, -1).join(' ');
    const ownerDiscordId = assertDiscordTag(rawOwnerDiscordId, 'discordOwnerTag');

    const team = await teamService.createTeam({
      name,
      ownerDiscordId,
      budget: DEFAULT_TEAM_BUDGET
    });

    const embed = successEmbed('Squadra creata', 'La squadra e stata registrata con successo.', [
      { name: 'Team ID', value: String(team.id), inline: true },
      { name: 'Squadra', value: formatTeamLabel(team), inline: true },
      { name: 'Budget', value: team.budget.toString(), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


