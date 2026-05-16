const playerService = require('../services/playerService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'chi',
  description: 'Mostra chi possiede un giocatore',
  usage: 'chi <nomeGiocatore|playerId>',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const info = await playerService.getPlayerValueInfo(playerIdentifier);
    const owner = info.ownerTeam
      ? formatTeamLabel(info.ownerTeam)
      : 'Nessuno, giocatore svincolato';

    const embed = successEmbed('Proprieta giocatore', `${info.player.player_name}: ${owner}`);
    await message.reply({ embeds: [embed] });
  }
};

