const marketService = require('../services/marketService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'aprimercato',
  description: 'Apre il mercato',
  usage: 'aprimercato',
  category: 'Mercato',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);
    await marketService.openMarket();

    const embed = successEmbed('Mercato aperto', 'market_status impostato su OPEN.');
    await message.reply({ embeds: [embed] });
  }
};

