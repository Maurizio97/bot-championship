const { successEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'comandi',
  description: 'Mostra l\'elenco dei comandi disponibili',
  usage: '&comandi',
  async execute(message, args, context = {}) {
    const commands = context.commands;
    const list = [];
    if (commands && commands.size > 0) {
      for (const [, command] of commands) {
        list.push(`- \`${command.usage || `&${command.name}`}\` - ${command.description || 'Nessuna descrizione'}`);
      }
    }

    const description = list.length > 0 ? list.join('\n') : 'Nessun comando disponibile.';

    const embed = successEmbed('Elenco comandi', description);
    await message.reply({ embeds: [embed] });
  }
};

