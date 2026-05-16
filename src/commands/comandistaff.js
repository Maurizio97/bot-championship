const { successEmbed } = require('../utils/embedFactory');
const { ensureAdminByMessage } = require('../utils/adminGuard');

module.exports = {
  name: 'comandistaff',
  description: 'Mostra l\'elenco di TUTTI i comandi (solo admin)',
  usage: 'comandistaff',
  category: 'Utility',
  adminOnly: true,
  async execute(message, args, context = {}) {
    try {
      await ensureAdminByMessage(message);

      const commands = context.commands;
      const prefix = context.prefix || '!';

      // Group all commands by category
      const categories = {};
      if (commands && commands.size > 0) {
        for (const [, command] of commands) {
          const category = command.category || 'Altro';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(command);
        }
      }

      // Create embed fields for each category
      const fields = [];
      const sortedCategories = Object.keys(categories).sort();

      for (const category of sortedCategories) {
        const cmds = categories[category];
        const commandList = cmds
          .map((cmd) => {
            const adminIndicator = cmd.adminOnly ? ' 🔐' : '';
            return `\`${cmd.usage || `${prefix}${cmd.name}`}\` - ${cmd.description || 'Nessuna descrizione'}${adminIndicator}`;
          })
          .join('\n')
          .slice(0, 1024); // Limit field value to 1024 chars

        if (commandList && commandList.trim()) {
          fields.push({
            name: category,
            value: commandList,
            inline: false
          });
        }
      }

      const embed = successEmbed('Elenco comandi (Staff)', '🔐 = Solo Admin', fields);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Errore nel comando comandistaff:', error);
      throw error;
    }
  }
};

