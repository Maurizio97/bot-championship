const draftService = require('../services/draftService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'chiudidraft',
  description: 'Chiude il draft giocatori',
  usage: 'chiudidraft',
  category: 'Draft',
  adminOnly: true,
  async execute(message) {
    await ensureAdminByMessage(message);
    await draftService.closeDraft();

    const embed = successEmbed('Draft chiuso', 'Lo stato draft e ora CLOSED.');
    await message.reply({ embeds: [embed] });
  }
};

