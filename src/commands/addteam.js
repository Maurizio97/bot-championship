const { DEFAULT_TEAM_BUDGET } = require('../config/constants');
const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { assertDiscordId } = require('../utils/validators');

module.exports = {
  name: 'addteam',
  description: 'Crea una nuova squadra',
  usage: '&addteam <nomeSquadra> <discordOwnerId>',
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length < 2) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const ownerDiscordId = args[args.length - 1];
    const name = args.slice(0, -1).join(' ');
    assertDiscordId(ownerDiscordId, 'discordOwnerId');

    const team = await teamService.createTeam({
      name,
      ownerDiscordId,
      budget: DEFAULT_TEAM_BUDGET
    });

    const embed = successEmbed('Squadra creata', `La squadra **${team.name}** e stata registrata con successo.`, [
      { name: 'Team ID', value: String(team.id), inline: true },
      { name: 'Owner Discord ID', value: team.owner_discord_id, inline: true },
      { name: 'Budget', value: team.budget.toString(), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


