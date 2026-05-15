const commands = require('../commands');
const env = require('../config/env');
const { errorEmbed } = require('../utils/embedFactory');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(env.prefix)) return;

    const withoutPrefix = message.content.slice(env.prefix.length).trim();
    const [commandName, ...args] = withoutPrefix.split(/\s+/);
    if (!commandName) return;

    const normalizedCommandName = commandName.toLowerCase();
    let command = commands.get(normalizedCommandName);

    if (!command) {
      command = [...commands.values()].find((item) =>
        Array.isArray(item.aliases) && item.aliases.map((alias) => alias.toLowerCase()).includes(normalizedCommandName)
      );
    }

    if (!command) return;

    try {
      await command.execute(message, args, { commands, prefix: env.prefix });
    } catch (error) {
      const embed = errorEmbed('Operazione fallita', error.message || 'Errore non gestito.');
      await message.reply({ embeds: [embed] });
    }
  }
};

