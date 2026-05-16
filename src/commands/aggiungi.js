const budgetService = require('../services/budgetService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { assertPositiveAmount } = require('../utils/validators');

module.exports = {
  name: 'aggiungi',
  description: 'Aggiunge budget a una squadra',
  usage: '&aggiungi <teamName> <amount> <reason>',
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    if (args.length < 3) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const amountIndex = args.findIndex((token) => /^\d+$/.test(token));
    if (amountIndex <= 0 || amountIndex >= args.length - 1) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const amount = assertPositiveAmount(args[amountIndex], 'amount');
    const teamName = args.slice(0, amountIndex).join(' ').trim();
    const reason = args.slice(amountIndex + 1).join(' ').trim();

    const team = await budgetService.addBudget({
      teamName,
      amount,
      reason,
      adminId: admin.id
    });

    const embed = successEmbed('Budget aggiornato', 'Credito aggiunto con log persistente.', [
      { name: 'Squadra', value: formatTeamLabel(team), inline: true },
      { name: 'Nuovo budget', value: String(team.budget), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};


