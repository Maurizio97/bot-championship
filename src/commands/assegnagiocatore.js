const playerService = require('../services/playerService');
const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { BadRequestError } = require('../utils/errors');

function parsePrice(rawPrice) {
  const parsed = Number(rawPrice);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestError('Il prezzo deve essere un intero maggiore o uguale a 0.');
  }

  return parsed;
}

async function parseAssignInput(args, usage) {
  const rawInput = args.join(' ').trim();
  if (!rawInput) {
    throw new BadRequestError(`Uso corretto: ${usage}`);
  }

  if (rawInput.includes(',')) {
    const parts = rawInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length !== 3) {
      throw new BadRequestError(`Uso corretto: ${usage}. Esempio: assegnagiocatore Ronaldo Team A 55`);
    }

    return {
      playerIdentifier: parts[0],
      teamIdentifier: parts[1],
      price: parsePrice(parts[2])
    };
  }

  if (args.length < 3) {
    throw new BadRequestError(`Uso corretto: ${usage}`);
  }

  const priceToken = args[args.length - 1];
  const price = parsePrice(priceToken);
  const headTokens = args.slice(0, -1);

  const candidates = [];
  for (let splitIndex = 1; splitIndex < headTokens.length; splitIndex += 1) {
    const playerIdentifier = headTokens.slice(0, splitIndex).join(' ').trim();
    const teamIdentifier = headTokens.slice(splitIndex).join(' ').trim();

    if (!playerIdentifier || !teamIdentifier) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const team = await teamService.findTeamByIdentifier(teamIdentifier);
    if (team) {
      candidates.push({ playerIdentifier, teamIdentifier });
    }
  }

  if (candidates.length !== 1) {
    throw new BadRequestError(
      `Uso corretto: ${usage}. Formato consigliato: assegnagiocatore <giocatore> <squadra|@owner> <prezzo>`
    );
  }

  return {
    playerIdentifier: candidates[0].playerIdentifier,
    teamIdentifier: candidates[0].teamIdentifier,
    price
  };
}

module.exports = {
  name: 'assegnagiocatore',
  aliases: ['assignplayer'],
  description: 'Assegna un giocatore svincolato a una squadra con prezzo d asta',
  usage: 'assegnagiocatore <nomeGiocatore|playerId> <squadra|@owner> <prezzo>',
  category: 'Gestione Giocatori',
  adminOnly: true,
  async execute(message, args) {
    const admin = await ensureAdminByMessage(message);

    const { playerIdentifier, teamIdentifier, price } = await parseAssignInput(args, this.usage);
    const toTeam = await teamService.getTeamByIdentifier(teamIdentifier);

    const result = await playerService.assignPlayerToTeam({
      playerIdentifier,
      toTeamId: toTeam.id,
      purchasePrice: price,
      adminId: admin.id
    });

    const embed = successEmbed('Assegnazione completata', 'Giocatore svincolato assegnato con prezzo d asta.', [
      { name: 'Giocatore', value: result.player.player_name, inline: true },
      { name: 'Squadra', value: result.team.name, inline: true },
      { name: 'Prezzo', value: String(result.spent), inline: true },
      { name: 'Budget residuo', value: String(result.remainingBudget), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};
