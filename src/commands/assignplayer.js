const playerService = require('../services/playerService');
const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { assertPositiveInteger } = require('../utils/validators');

module.exports = {
  name: 'assignplayer',
  description: 'Assegna un giocatore a una squadra',
  usage: '&assignplayer <nomeGiocatore|playerId> <teamId>',
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    if (args.length < 2) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const teamId = assertPositiveInteger(args[args.length - 1], 'teamId');
    const playerIdentifier = args.slice(0, -1).join(' ').trim();

    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const result = await playerService.assignPlayerToTeam({
      playerIdentifier,
      toTeamId: teamId,
      adminId: admin.id
    });

    const oldTeamLabel = result.fromTeamId ? (await teamService.getTeamById(result.fromTeamId)).name : 'Nessuna';

    const embed = successEmbed('Trasferimento completato', 'Assegnazione giocatore registrata e salvata nello storico.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Vecchia squadra', value: oldTeamLabel, inline: true },
      { name: 'Nuova squadra', value: result.toTeam.name, inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

