const budgetService = require('../services/budgetService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel, getDiscordIdentityCandidates } = require('../utils/discordIdentity');

module.exports = {
  name: 'budget',
  description: 'Mostra budget residuo, valore rosa e totale giocatori',
  usage: 'budget [nomeSquadra]',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    const info = args.length > 0
      ? await budgetService.getTeamBudgetInfoByName(args.join(' ').trim())
      : await budgetService.getTeamBudgetInfoByOwner(getDiscordIdentityCandidates(message.author));

    const embed = successEmbed('Budget squadra', 'Situazione economica attuale.', [
      { name: 'Squadra', value: formatTeamLabel(info.team), inline: true },
      { name: 'Budget residuo', value: String(info.budget), inline: true },
      { name: 'Totale giocatori', value: String(info.totalPlayers), inline: true },
      { name: 'Valore rosa', value: String(info.rosterValue), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

