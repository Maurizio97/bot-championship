const { sequelize } = require('../models');
const playerRepository = require('../repositories/playerRepository');
const transferRepository = require('../repositories/transferRepository');
const teamService = require('./teamService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

function buildPlayerSuggestionsMessage(playerQuery, matches) {
  const suggestions = matches.slice(0, 10).map((player) => {
    const teamLabel = player.team ? player.team.name : 'Svincolato';
    return `- ID ${player.id}: ${player.player_name} (${player.overall}) - ${teamLabel}`;
  });

  return [
    `Trovati piu giocatori per "${playerQuery}".`,
    'Prova con un nome piu preciso oppure usa uno di questi ID:',
    ...suggestions
  ].join('\n');
}

async function findPlayerByIdentifierOrSuggest(playerIdentifier) {
  const normalized = String(playerIdentifier || '').trim();

  if (!normalized) {
    throw new BadRequestError('Devi indicare il nome o ID del giocatore.');
  }

  if (/^\d+$/.test(normalized)) {
    const playerById = await playerRepository.findById(Number(normalized));

    if (!playerById) {
      throw new NotFoundError(`Giocatore con ID ${normalized} non trovato.`);
    }

    return playerById;
  }

  const matches = await playerRepository.findByName(normalized, 10);

  if (matches.length > 1) {
    throw new BadRequestError(buildPlayerSuggestionsMessage(normalized, matches));
  }

  const [player] = matches;
  if (!player) {
    throw new NotFoundError(`Nessun giocatore trovato per "${normalized}".`);
  }

  return player;
}

async function assignPlayerToTeam({ playerIdentifier, toTeamId }) {
  if (!Number.isInteger(toTeamId)) {
    throw new BadRequestError('teamId deve essere un numero intero.');
  }

  const player = await findPlayerByIdentifierOrSuggest(playerIdentifier);

  const toTeam = await teamService.getTeamById(toTeamId);
  const fromTeamId = player.team_id;

  if (fromTeamId === toTeam.id) {
    throw new BadRequestError('Il giocatore appartiene gia a questa squadra.');
  }

  return sequelize.transaction(async (transaction) => {
    player.team_id = toTeam.id;
    await playerRepository.save(player, { transaction });

    await transferRepository.createTransfer(
      {
        player_id: player.id,
        from_team_id: fromTeamId,
        to_team_id: toTeam.id,
        price: player.price
      },
      { transaction }
    );

    return {
      player,
      fromTeamId,
      toTeam
    };
  });
}

async function getPlayerValueInfo(playerIdentifier) {
  const player = await findPlayerByIdentifierOrSuggest(playerIdentifier);
  const team = player.team || (player.team_id ? await teamService.getTeamById(player.team_id) : null);

  return {
    player,
    isAvailable: !player.team_id,
    ownerTeam: team
  };
}

module.exports = {
  assignPlayerToTeam,
  findPlayerByIdentifierOrSuggest,
  getPlayerValueInfo
};

