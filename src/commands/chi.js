const playerService = require('../services/playerService');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'chi',
  description: 'Mostra chi possiede un giocatore',
  usage: '&chi <nomeGiocatore|playerId>',
  async execute(message, args) {
    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const info = await playerService.getPlayerValueInfo(playerIdentifier);
    const owner = info.ownerTeam
      ? `${info.ownerTeam.name} (${info.ownerTeam.owner_discord_id})`
      : 'Nessuno, giocatore svincolato';

    const embed = successEmbed('Proprieta giocatore', `${info.player.player_name}: ${owner}`);
    await message.reply({ embeds: [embed] });
  }
};

