const { sequelize } = require('../models');
const playerRepository = require('../repositories/playerRepository');
const transferRepository = require('../repositories/transferRepository');
const budgetLogRepository = require('../repositories/budgetLogRepository');
const teamRepository = require('../repositories/teamRepository');
const teamService = require('./teamService');
const { calculateReleaseClause } = require('./playerValueService');
const { MIN_TEAM_PLAYERS, MIN_PLAYER_PRICE } = require('../config/constants');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

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

async function buyFreePlayerForTeam({ playerIdentifier, toTeamId, adminId = null }) {
  if (!Number.isInteger(toTeamId)) {
    throw new BadRequestError('teamId deve essere un numero intero.');
  }

  const player = await findPlayerByIdentifierOrSuggest(playerIdentifier);
  const toTeam = await teamService.getTeamById(toTeamId);

  return sequelize.transaction(async (transaction) => {
    const playerLocked = await playerRepository.findByIdForUpdate(player.id, transaction);
    const teamLocked = await teamRepository.findByIdForUpdate(toTeam.id, transaction);

    if (!teamLocked) {
      throw new NotFoundError(`Squadra con ID ${toTeamId} non trovata.`);
    }

    if (playerLocked.team_id) {
      throw new ConflictError(`Il giocatore ${playerLocked.player_name} e gia assegnato.`);
    }

    if (Number(teamLocked.budget) < Number(playerLocked.price)) {
      throw new ConflictError(`Budget insufficiente. Costo ${playerLocked.price}, disponibile ${teamLocked.budget}.`);
    }

    const currentRosterCount = await playerRepository.countByTeamId(teamLocked.id, { transaction });
    const rosterCountAfterPick = currentRosterCount + 1;
    const remainingSlotsToMinimum = Math.max(0, MIN_TEAM_PLAYERS - rosterCountAfterPick);
    const remainingBudgetAfterPick = Number(teamLocked.budget) - Number(playerLocked.price);
    const minimumBudgetNeededToCompleteRoster = remainingSlotsToMinimum * MIN_PLAYER_PRICE;

    if (remainingBudgetAfterPick < minimumBudgetNeededToCompleteRoster) {
      throw new ConflictError(
        `Operazione non consentita: dopo questo acquisto resteresti con ${remainingBudgetAfterPick}, ma servono almeno ${minimumBudgetNeededToCompleteRoster} per completare una rosa minima di ${MIN_TEAM_PLAYERS} giocatori.`
      );
    }

    playerLocked.team_id = teamLocked.id;
    await playerRepository.save(playerLocked, { transaction });

    teamLocked.budget = Number(teamLocked.budget) - Number(playerLocked.price);
    await teamRepository.save(teamLocked, { transaction });

    await transferRepository.createTransfer(
      {
        player_id: playerLocked.id,
        from_team_id: null,
        to_team_id: teamLocked.id,
        price: playerLocked.price
      },
      { transaction }
    );

    const reasonSuffix = adminId ? ` (admin ${adminId})` : '';
    await budgetLogRepository.createLog(
      {
        team_id: teamLocked.id,
        amount: -Number(playerLocked.price),
        type: 'MARKET_PURCHASE',
        reason: `Acquisto fuori draft di ${playerLocked.player_name}${reasonSuffix}`
      },
      { transaction }
    );

    return {
      player: playerLocked,
      team: teamLocked,
      spent: Number(playerLocked.price),
      remainingBudget: Number(teamLocked.budget)
    };
  });
}

async function releasePlayerFromTeam({ playerIdentifier, adminId = null }) {
  const player = await findPlayerByIdentifierOrSuggest(playerIdentifier);

  return sequelize.transaction(async (transaction) => {
    const playerLocked = await playerRepository.findByIdForUpdate(player.id, transaction);

    if (!playerLocked.team_id) {
      throw new ConflictError(`Il giocatore ${playerLocked.player_name} e gia svincolato.`);
    }

    const fromTeam = await teamRepository.findByIdForUpdate(playerLocked.team_id, transaction);
    if (!fromTeam) {
      throw new NotFoundError('Squadra del giocatore non trovata.');
    }

    playerLocked.team_id = null;
    await playerRepository.save(playerLocked, { transaction });

    const refundAmount = Number(playerLocked.price);
    fromTeam.budget = Number(fromTeam.budget) + refundAmount;
    await teamRepository.save(fromTeam, { transaction });

    const reasonSuffix = adminId ? ` (admin ${adminId})` : '';
    await budgetLogRepository.createLog(
      {
        team_id: fromTeam.id,
        amount: refundAmount,
        type: 'ADD',
        reason: `Svincolo di ${playerLocked.player_name}${reasonSuffix}`
      },
      { transaction }
    );

    return {
      player: playerLocked,
      fromTeam,
      refunded: refundAmount,
      newBudget: Number(fromTeam.budget)
    };
  });
}

async function getPlayerValueInfo(playerIdentifier) {
  const player = await findPlayerByIdentifierOrSuggest(playerIdentifier);
  const team = player.team || (player.team_id ? await teamService.getTeamById(player.team_id) : null);

  return {
    player,
    isAvailable: !player.team_id,
    ownerTeam: team,
    releaseClause: calculateReleaseClause(player.price)
  };
}

module.exports = {
  assignPlayerToTeam,
  buyFreePlayerForTeam,
  findPlayerByIdentifierOrSuggest,
  getPlayerValueInfo,
  releasePlayerFromTeam
};
