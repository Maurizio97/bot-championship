const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { importStatsRowsFromAttachment } = require('../services/csvPlayerStatsImporter');
const seasonService = require('../services/seasonService');

function formatIssueRows(rows, formatter) {
  if (!rows || rows.length === 0) {
    return '0';
  }

  const preview = rows
    .slice(0, 6)
    .map((row) => formatter(row))
    .join('\n');

  return `${rows.length}\n${preview}`.slice(0, 1024);
}

module.exports = {
  name: 'season',
  aliases: ['stagione'],
  description: 'Gestione stagioni: creazione da CSV e rollback ultima stagione',
  usage: 'season <new|rollback>',
  category: 'Stagioni',
  adminOnly: true,
  async execute(message, args) {
    await ensureAdminByMessage(message);

    const action = String(args[0] || '').trim().toLowerCase();
    if (!action || !['new', 'rollback'].includes(action)) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    if (action === 'new') {
      const imported = await importStatsRowsFromAttachment(message);
      const result = await seasonService.createNewSeasonFromRows({
        rows: imported.rows,
        adminDiscordId: message.author.id,
        reason: `SEASON_UPDATE:${imported.fileName}`
      });

      const embed = successEmbed('Nuova stagione creata', `CSV elaborato: ${imported.fileName}`, [
        { name: 'Stagione precedente', value: String(result.previousSeason), inline: true },
        { name: 'Nuova stagione', value: String(result.newSeason), inline: true },
        { name: 'Giocatori aggiornati', value: String(result.updatedPlayers), inline: true },
        { name: 'Saliti di overall', value: String(result.increasedPlayers), inline: true },
        { name: 'Scesi di overall', value: String(result.decreasedPlayers), inline: true },
        { name: 'Invariati', value: String(result.unchangedPlayers), inline: true },
        {
          name: 'Giocatori non trovati',
          value: formatIssueRows(result.notFoundRows, (row) => `L${row.lineNumber} - ${row.playerName || row.playerId}`),
          inline: false
        },
        {
          name: 'Righe CSV non valide',
          value: formatIssueRows(result.invalidRows, (row) => `L${row.lineNumber} - ${row.reason}`),
          inline: false
        },
        {
          name: 'Giocatori ambigui',
          value: formatIssueRows(result.ambiguousRows, (row) => `L${row.lineNumber} - ${row.playerName}`),
          inline: false
        }
      ]);

      await message.reply({ embeds: [embed] });
      return;
    }

    const rollbackResult = await seasonService.rollbackCurrentSeason();
    const embed = successEmbed('Rollback stagione completato', 'Ripristino dell\'ultima stagione eseguito con successo.', [
      { name: 'Stagione rollbackata', value: String(rollbackResult.rolledBackSeason), inline: true },
      { name: 'Stagione corrente', value: String(rollbackResult.currentSeason), inline: true },
      { name: 'Giocatori ripristinati', value: String(rollbackResult.restoredPlayers), inline: true },
      { name: 'Righe storico eliminate', value: String(rollbackResult.deletedHistoryRows), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

