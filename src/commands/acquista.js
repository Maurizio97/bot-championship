const playerService = require('../services/playerService');
const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { assertDiscordTag } = require('../utils/validators');

module.exports = {
  name: 'acquista',
  description: 'Assegna un giocatore svincolato a una squadra fuori dal draft',
  usage: 'acquista <nomeGiocatore|playerId> <@owner>',
  category: 'Gestione Giocatori',
  adminOnly: true,
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    if (args.length < 2) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const ownerDiscordId = assertDiscordTag(args[args.length - 1], 'discordOwnerTag');
    const playerIdentifier = args.slice(0, -1).join(' ').trim();

    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const team = await teamService.getTeamByOwnerCandidates([ownerDiscordId]);

    const result = await playerService.buyFreePlayerForTeam({
      playerIdentifier,
      toTeamId: team.id,
      adminId: admin.id
    });

    const embed = successEmbed('Acquisto registrato', 'Giocatore assegnato fuori draft con aggiornamento budget.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Squadra', value: formatTeamLabel(result.team), inline: true },
      { name: 'Costo', value: String(result.spent), inline: true },
      { name: 'Budget residuo', value: String(result.remainingBudget), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


