const commands = require('../commands');
const env = require('../config/env');
const { errorEmbed } = require('../utils/embedFactory');
const { hasDiscordAdminRole } = require('../utils/discordRoleGuard');

const DRAFT_RESTRICTED_CHANNEL_ID = '1369075843288268820';
const DRAFT_ALLOWED_COMMANDS_FOR_NON_ADMIN = new Set(['scegli']);

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

    const isAdmin = hasDiscordAdminRole(message);

    if (
      message.channel?.id === DRAFT_RESTRICTED_CHANNEL_ID &&
      !isAdmin &&
      !DRAFT_ALLOWED_COMMANDS_FOR_NON_ADMIN.has(command.name)
    ) {
      const allowedCommands = [...DRAFT_ALLOWED_COMMANDS_FOR_NON_ADMIN]
        .map((commandItem) => `${env.prefix}${commandItem}`)
        .join(', ');

      const embed = errorEmbed(
        'Comando non consentito in questo canale',
        `In questo canale puoi usare solo: ${allowedCommands}`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check: comando admin-only richiede ruolo Discord
    if (command.adminOnly && !isAdmin) {
      const embed = errorEmbed(
        'Accesso negato',
        '🔐 Questo comando richiede il ruolo admin Discord.'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    try {
      await command.execute(message, args, { commands, prefix: env.prefix });
    } catch (error) {
      const embed = errorEmbed('Operazione fallita', error.message || 'Errore non gestito.');
      await message.reply({ embeds: [embed] });
    }
  }
};

