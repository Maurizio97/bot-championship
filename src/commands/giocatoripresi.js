const playerRepository = require('../repositories/playerRepository');
const { successEmbed } = require('../utils/embedFactory');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const PAGINATION_TIMEOUT_MS = 15 * 60 * 1000;

function parseCommandArgs(args) {
  const flags = {};
  const positionalArgs = [];

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      flags[key] = value || true;
    } else {
      positionalArgs.push(arg);
    }
  }

  return { flags, positionalArgs };
}

function buildPlayerRow(player, index) {
  const teamLabel = player.team ? player.team.name : 'Svincolato';
  return `${index}. **ID ${player.id}** - ${player.player_name} (${player.role}) - Overall: ${player.overall} - Team: ${teamLabel}`;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPaginationRow(currentPage, totalPages, disabledAll = false) {
  const hasMultiplePages = totalPages > 1;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('taken_players_prev')
      .setLabel('Indietro')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabledAll || !hasMultiplePages || currentPage <= 1),
    new ButtonBuilder()
      .setCustomId('taken_players_next')
      .setLabel('Avanti')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabledAll || !hasMultiplePages || currentPage >= totalPages)
  );
}

function buildEmbedPayload(result, currentPage, perPage, disableButtons = false) {
  const offset = (currentPage - 1) * perPage;
  const playerList = result.players
    .map((player, index) => buildPlayerRow(player, offset + index + 1))
    .join('\n');

  const totalPages = Math.max(1, result.pages || 1);
  const roleFilter = result.role ? ` - Filtro ruolo: "${result.role}"` : '';
  const paginationInfo = `Pagina ${currentPage} di ${totalPages} | Totale: ${result.total} giocatori`;
  const description = [
    `${paginationInfo}${roleFilter}`,
    '',
    playerList
  ].join('\n').slice(0, 4096);

  const embed = successEmbed('Giocatori assegnati', description);
  return {
    embeds: [embed],
    components: [buildPaginationRow(currentPage, totalPages, disableButtons)]
  };
}

module.exports = {
  name: 'presi',
  aliases: ['presi', 'assegnati'],
  description: 'Mostra l\'elenco dei giocatori già assegnati a un team',
  usage: 'presi [role]',
  category: 'Info',
  adminOnly: false,
  async execute(message, args) {
    const { flags, positionalArgs } = parseCommandArgs(args);

    let currentPage = parsePositiveInt(flags.page || '1', 1);
    const perPage = Math.min(100, parsePositiveInt(flags['per-page'] || '20', 20));
    const role = positionalArgs.length > 0 ? positionalArgs.join(' ').trim() : null;
    const getPage = async (pageNumber) => playerRepository.findTakenPlayers({
      role,
      limit: perPage,
      offset: (pageNumber - 1) * perPage
    });

    let result = await getPage(currentPage);

    if (result.total > 0 && result.players.length === 0 && result.pages > 0) {
      currentPage = result.pages;
      result = await getPage(currentPage);
    }

    if (result.players.length === 0) {
      const roleFilter = role ? ` con ruolo "${role}"` : '';
      const embed = successEmbed(
        'Giocatori assegnati',
        `Nessun giocatore assegnato${roleFilter} trovato.`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    result.role = role;
    const sentMessage = await message.reply(buildEmbedPayload(result, currentPage, perPage));

    if (!sentMessage || typeof sentMessage.createMessageComponentCollector !== 'function') {
      return;
    }

    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PAGINATION_TIMEOUT_MS,
      filter: (interaction) => interaction.user.id === message.author.id
    });

    collector.on('collect', async (interaction) => {
      if (typeof collector.resetTimer === 'function') {
        collector.resetTimer();
      }

      const targetPage = interaction.customId === 'taken_players_prev'
        ? Math.max(1, currentPage - 1)
        : Math.min(Math.max(1, result.pages || 1), currentPage + 1);

      if (targetPage === currentPage) {
        await interaction.deferUpdate();
        return;
      }

      currentPage = targetPage;
      result = await getPage(currentPage);
      result.role = role;
      await interaction.update(buildEmbedPayload(result, currentPage, perPage));
    });

    collector.on('end', async () => {
      try {
        await sentMessage.edit(buildEmbedPayload(result, currentPage, perPage, true));
      } catch (error) {
        // Il messaggio potrebbe non essere piu modificabile.
      }
    });
  }
};
