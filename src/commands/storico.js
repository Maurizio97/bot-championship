const playerService = require('../services/playerService');
const overallService = require('../services/overallService');
const { successEmbed } = require('../utils/embedFactory');

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

module.exports = {
  name: 'storico',
  aliases: ['history', 'storicogiocatore'],
  description: 'Mostra lo storico overall sintetico di un giocatore',
  usage: 'storico <nomeGiocatore|playerId>',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const player = await playerService.findPlayerByIdentifierOrSuggest(playerIdentifier);
    const summary = await overallService.getPlayerOverallSummary(player.id);

    const embed = successEmbed('Storico giocatore', 'Riepilogo evoluzione overall.', [
      { name: 'ID', value: String(summary.player.id), inline: true },
      { name: 'Giocatore', value: summary.player.player_name, inline: true },
      { name: 'Overall iniziale', value: String(summary.initialOverall), inline: true },
      { name: 'Overall attuale', value: String(summary.currentOverall), inline: true },
      { name: 'Salita complessiva', value: formatDelta(summary.overallDelta), inline: true },
      { name: 'Valore attuale', value: String(summary.currentValue), inline: true },
      { name: 'Modifiche registrate', value: String(summary.totalChanges), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

