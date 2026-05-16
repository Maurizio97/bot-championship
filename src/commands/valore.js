const playerService = require('../services/playerService');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'valore',
  description: 'Mostra dati e disponibilita di un giocatore',
  usage: 'valore <nomeGiocatore|playerId>',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const info = await playerService.getPlayerValueInfo(playerIdentifier);

    const embed = successEmbed('Valore giocatore', 'Dettaglio giocatore richiesto.', [
      { name: 'Giocatore', value: info.player.player_name, inline: true },
      { name: 'Ruolo', value: info.player.role, inline: true },
      { name: 'Overall', value: String(info.player.overall), inline: true },
      { name: 'Prezzo', value: String(info.player.price), inline: true },
      { name: 'Disponibilita', value: info.isAvailable ? 'Disponibile' : 'Assegnato', inline: true },
      { name: 'Proprietario', value: info.ownerTeam?.name || 'Svincolato', inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

