const playerService = require('../services/playerService');
const teamService = require('../services/teamService');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { BadRequestError } = require('../utils/errors');

function parsePrice(rawPrice) {
  const parsed = Number(rawPrice);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestError('Il prezzo deve essere un intero maggiore o uguale a 0.');
  }

  return parsed;
}

function parseCsvInput(rawInput, usage) {
  const parts = String(rawInput || '')
    .split(',')
    .map((item) => item.trim());

  if (parts.length !== 4 || parts.some((item) => !item)) {
    throw new BadRequestError(
      `Uso corretto: ${usage}. Esempio: acquista Cristiano Ronaldo 0 Team A Team B`
    );
  }

  return {
    playerIdentifier: parts[0],
    price: parsePrice(parts[1]),
    fromTeamIdentifier: parts[2],
    toTeamIdentifier: parts[3]
  };
}

async function parseWhitespaceInput(args, usage) {
  const candidates = [];
  for (let priceIndex = 1; priceIndex <= args.length - 3; priceIndex += 1) {
    const priceToken = args[priceIndex];
    if (!/^\d+$/.test(priceToken)) {
      continue;
    }

    const playerIdentifier = args.slice(0, priceIndex).join(' ').trim();
    const teamTokens = args.slice(priceIndex + 1);
    const price = parsePrice(priceToken);

    if (!playerIdentifier || teamTokens.length < 2) {
      continue;
    }

    for (let splitIndex = 1; splitIndex < teamTokens.length; splitIndex += 1) {
      const fromTeamIdentifier = teamTokens.slice(0, splitIndex).join(' ').trim();
      const toTeamIdentifier = teamTokens.slice(splitIndex).join(' ').trim();

      if (!fromTeamIdentifier || !toTeamIdentifier) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const [fromTeam, toTeam] = await Promise.all([
        teamService.findTeamByIdentifier(fromTeamIdentifier),
        teamService.findTeamByIdentifier(toTeamIdentifier)
      ]);

      if (fromTeam && toTeam) {
        candidates.push({
          playerIdentifier,
          price,
          fromTeamIdentifier,
          toTeamIdentifier
        });
      }
    }
  }

  if (candidates.length !== 1) {
    throw new BadRequestError(
      `Uso corretto: ${usage}. Formato consigliato: acquista <giocatore> <prezzo> <squadraVenditrice> <squadraAcquirente>`
    );
  }

  return {
    playerIdentifier: candidates[0].playerIdentifier,
    price: candidates[0].price,
    fromTeamIdentifier: candidates[0].fromTeamIdentifier,
    toTeamIdentifier: candidates[0].toTeamIdentifier
  };
}

async function parseCommandInput(args, usage) {
  const rawInput = args.join(' ').trim();
  if (!rawInput) {
    throw new BadRequestError(`Uso corretto: ${usage}`);
  }

  if (rawInput.includes(',')) {
    return parseCsvInput(rawInput, usage);
  }

  return parseWhitespaceInput(args, usage);
}

module.exports = {
  name: 'acquista',
  description: 'Trasferisce un giocatore tra squadre durante il mercato aperto',
  usage: 'acquista <nomeGiocatore|playerId> <prezzo> <squadraVenditrice|@owner> <squadraAcquirente|@owner>',
  category: 'Mercato',
  adminOnly: false,
  async execute(message, args) {
    const {
      playerIdentifier,
      price,
      fromTeamIdentifier,
      toTeamIdentifier
    } = await parseCommandInput(args, this.usage);

    const [fromTeam, toTeam] = await Promise.all([
      teamService.getTeamByIdentifier(fromTeamIdentifier),
      teamService.getTeamByIdentifier(toTeamIdentifier)
    ]);

    const result = await playerService.transferPlayerBetweenTeams({
      playerIdentifier,
      price,
      fromTeamId: fromTeam.id,
      toTeamId: toTeam.id,
      actorDiscordId: message.author?.id || null
    });

    const embed = successEmbed('Trasferimento registrato', 'Operazione mercato completata con aggiornamento budget.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Venditore', value: formatTeamLabel(result.fromTeam), inline: true },
      { name: 'Acquirente', value: formatTeamLabel(result.toTeam), inline: true },
      { name: 'Prezzo', value: String(result.price), inline: true },
      { name: 'Budget venditore', value: String(result.fromRemainingBudget), inline: true },
      { name: 'Budget acquirente', value: String(result.toRemainingBudget), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};
