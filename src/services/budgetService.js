const { sequelize } = require('../models');
const teamRepository = require('../repositories/teamRepository');
const budgetLogRepository = require('../repositories/budgetLogRepository');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

function parseAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError('amount deve essere un intero positivo.');
  }
  return parsed;
}

function buildOwnerCandidates(rawIdentifier) {
  const normalized = String(rawIdentifier || '').trim();
  if (!normalized) {
    return [];
  }

  const mentionMatch = normalized.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) {
    return [mentionMatch[1]];
  }

  const noAtPrefix = normalized.startsWith('@') ? normalized.slice(1).trim() : '';
  return noAtPrefix ? [normalized, noAtPrefix] : [normalized];
}

async function findTeamByNameOrFail(teamName, options = {}) {
  const team = await teamRepository.findByNameOrOwnerCandidates(teamName, buildOwnerCandidates(teamName), options);
  if (!team) {
    throw new NotFoundError(`Squadra ${teamName} non trovata.`);
  }
  return team;
}

async function addBudget({ teamName, amount, reason, adminId }) {
  const normalizedReason = String(reason || '').trim();
  if (!normalizedReason) {
    throw new BadRequestError('reason obbligatorio.');
  }

  const parsedAmount = parseAmount(amount);

  return sequelize.transaction(async (transaction) => {
    const team = await findTeamByNameOrFail(teamName, { transaction });
    const lockedTeam = await teamRepository.findByIdForUpdate(team.id, transaction);

    lockedTeam.budget = Number(lockedTeam.budget) + parsedAmount;
    await teamRepository.save(lockedTeam, { transaction });

    await budgetLogRepository.createLog(
      {
        team_id: lockedTeam.id,
        amount: parsedAmount,
        type: 'ADD',
        reason: normalizedReason
      },
      { transaction }
    );

    return lockedTeam;
  });
}

async function removeBudget({ teamName, amount, reason, adminId }) {
  const normalizedReason = String(reason || '').trim();
  if (!normalizedReason) {
    throw new BadRequestError('reason obbligatorio.');
  }

  const parsedAmount = parseAmount(amount);

  return sequelize.transaction(async (transaction) => {
    const team = await findTeamByNameOrFail(teamName, { transaction });
    const lockedTeam = await teamRepository.findByIdForUpdate(team.id, transaction);

    if (Number(lockedTeam.budget) < parsedAmount) {
      throw new ConflictError(`Budget insufficiente: ${lockedTeam.budget}.`);
    }

    lockedTeam.budget = Number(lockedTeam.budget) - parsedAmount;
    await teamRepository.save(lockedTeam, { transaction });

    await budgetLogRepository.createLog(
      {
        team_id: lockedTeam.id,
        amount: -parsedAmount,
        type: 'REMOVE',
        reason: normalizedReason
      },
      { transaction }
    );

    return lockedTeam;
  });
}

async function getTeamBudgetInfoByOwner(ownerDiscordCandidates) {
  const team = await teamRepository.findByOwnerDiscordCandidates(ownerDiscordCandidates);
  if (!team) {
    throw new NotFoundError('Non hai una squadra registrata.');
  }

  return getTeamBudgetInfoByName(team.name);
}

async function getTeamBudgetInfoByName(teamName) {
  const team = await findTeamByNameOrFail(teamName);
  const rosterContainer = await teamRepository.findAllWithPlayers();
  const hydrated = rosterContainer.find((item) => item.id === team.id);
  const players = hydrated?.players || [];
  const rosterValue = players.reduce((acc, player) => acc + Number(player.price), 0);

  return {
    team: hydrated || team,
    totalPlayers: players.length,
    rosterValue,
    budget: Number(team.budget)
  };
}

module.exports = {
  addBudget,
  removeBudget,
  getTeamBudgetInfoByOwner,
  getTeamBudgetInfoByName
};



