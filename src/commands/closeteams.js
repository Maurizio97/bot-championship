const teamSelectionService = require('../services/teamSelectionService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'closeteams',
  description: 'Chiude fase scelta squadre',
  usage: '&closeteams',
  async execute(message) {
    await ensureAdminByMessage(message);
    await teamSelectionService.closeTeamSelection();

    const embed = successEmbed('Team selection chiusa', 'La fase di scelta squadre e terminata.');
    await message.reply({ embeds: [embed] });
  }
};

