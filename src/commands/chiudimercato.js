const marketService = require('../services/marketService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'chiudimercato',
  description: 'Chiude il mercato',
  usage: 'chiudimercato',
  category: 'Mercato',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);
    await marketService.closeMarket();

    const embed = successEmbed('Mercato chiuso', 'market_status impostato su CLOSED.');
    await message.reply({ embeds: [embed] });
  }
};

