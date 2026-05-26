const playerService = require('../services/playerService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');

module.exports = {
  name: 'svincola',
  description: 'Rimuove un giocatore dalla squadra e rimborsa il suo costo',
  usage: 'svincola <nomeGiocatore|playerId>',
  category: 'Gestione Giocatori',
  adminOnly: true,
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    const playerIdentifier = args.join(' ').trim();
    if (!playerIdentifier) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const result = await playerService.releasePlayerFromTeam({
      playerIdentifier,
      adminId: admin.id
    });

    const embed = successEmbed('Svincolo registrato', 'Giocatore rimosso dalla squadra con rimborso budget.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Squadra', value: formatTeamLabel(result.fromTeam), inline: true },
      { name: 'Rimborso', value: String(result.refunded), inline: true },
      { name: 'Nuovo budget', value: String(result.newBudget), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

