const { sequelize } = require('../models');
const draftOrderRepository = require('../repositories/draftOrderRepository');
const leagueStateRepository = require('../repositories/leagueStateRepository');
const playerRepository = require('../repositories/playerRepository');
const teamRepository = require('../repositories/teamRepository');
const transferRepository = require('../repositories/transferRepository');
const budgetLogRepository = require('../repositories/budgetLogRepository');
const stateManagerService = require('./stateManagerService');
const playerService = require('./playerService');
const env = require('../config/env');
const { MIN_TEAM_PLAYERS, MIN_PLAYER_PRICE } = require('../config/constants');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

function shuffle(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

async function getDraftOrder(options = {}) {
  return draftOrderRepository.findByType('PLAYER_DRAFT', options);
}

async function getCurrentTurnInfo() {
  const state = await leagueStateRepository.getSingleton();
  const order = await getDraftOrder();
  const currentEntry = order[state.current_draft_turn] || null;

  return {
    state,
    order,
    currentEntry
  };
}

async function startDraft() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    const teams = await teamRepository.findAllOrdered();

    if (teams.length === 0) {
      throw new BadRequestError('Nessuna squadra registrata per avviare il draft.');
    }

    const randomized = shuffle(teams);

    await draftOrderRepository.deleteByType('PLAYER_DRAFT', { transaction });
    await draftOrderRepository.bulkCreate(
      randomized.map((team, index) => ({
        type: 'PLAYER_DRAFT',
        discord_user_id: team.owner_discord_id,
        team_id: team.id,
        position: index
      })),
      { transaction }
    );

    state.current_round = 1;
    state.current_draft_turn = 0;
    state.draft_status = 'ACTIVE';
    await state.save({ transaction });

    // eslint-disable-next-line no-console
    console.log(`[DRAFT] started with ${randomized.length} teams`);

    return {
      state,
      order: await getDraftOrder({ transaction })
    };
  });
}

async function stopDraft() {
  const state = await stateManagerService.pauseDraft();
  // eslint-disable-next-line no-console
  console.log(`[DRAFT] paused at round ${state.current_round}, turn ${state.current_draft_turn}`);
  return state;
}

async function continueDraft() {
  const state = await stateManagerService.resumeDraft();
  // eslint-disable-next-line no-console
  console.log(`[DRAFT] resumed at round ${state.current_round}, turn ${state.current_draft_turn}`);
  return state;
}

async function closeDraft() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.draft_status = 'CLOSED';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log('[DRAFT] closed');
    return state;
  });
}

async function skipTurn() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.draft_status !== 'ACTIVE') {
      const hint = state.draft_status === 'PAUSED'
        ? `Il draft e in pausa. Usa ${env.prefix}continua per riprendere.`
        : `Il draft non e stato avviato. Usa ${env.prefix}iniziodraft.`;
      throw new ConflictError(hint);
    }

    const order = await getDraftOrder({ transaction });
    if (order.length === 0) {
      throw new NotFoundError(`Ordine draft non trovato. Avvia prima ${env.prefix}iniziodraft.`);
    }

    const { isNewRound: skipIsNewRound } = await stateManagerService.advanceDraftTurn({
      transaction,
      orderLength: order.length
    });

    if (skipIsNewRound) {
      await draftOrderRepository.reorderPlayerDraftByBudget(transaction);
      // eslint-disable-next-line no-console
      console.log('[DRAFT] skip: nuovo round, ordine ricalcolato per budget DESC');
    }

    return {
      order: await getDraftOrder({ transaction }),
      state: await leagueStateRepository.getForUpdate(transaction)
    };
  });
}

async function executeDraftPick({ transaction, state, order, playerIdentifier, teamId, adminId = null }) {
  const player = await playerService.findPlayerByIdentifierOrSuggest(playerIdentifier);
  const playerLocked = await playerRepository.findByIdForUpdate(player.id, transaction);

  if (playerLocked.team_id) {
    throw new ConflictError(`Il giocatore ${playerLocked.player_name} e gia assegnato.`);
  }

  const team = await teamRepository.findByIdForUpdate(teamId, transaction);
  if (!team) {
    throw new NotFoundError('Squadra di turno non trovata.');
  }

  if (Number(team.budget) < Number(playerLocked.price)) {
    throw new ConflictError(`Budget insufficiente. Costo ${playerLocked.price}, disponibile ${team.budget}.`);
  }

  const currentRosterCount = await playerRepository.countByTeamId(team.id, { transaction });
  const rosterCountAfterPick = currentRosterCount + 1;
  const remainingSlotsToMinimum = Math.max(0, MIN_TEAM_PLAYERS - rosterCountAfterPick);
  const remainingBudgetAfterPick = Number(team.budget) - Number(playerLocked.price);
  const minimumBudgetNeededToCompleteRoster = remainingSlotsToMinimum * MIN_PLAYER_PRICE;

  if (remainingBudgetAfterPick < minimumBudgetNeededToCompleteRoster) {
    throw new ConflictError(
      `Operazione non consentita: dopo questo acquisto resteresti con ${remainingBudgetAfterPick}, ma servono almeno ${minimumBudgetNeededToCompleteRoster} per completare una rosa minima di ${MIN_TEAM_PLAYERS} giocatori.`
    );
  }

  playerLocked.team_id = team.id;
  await playerRepository.save(playerLocked, { transaction });

  team.budget = Number(team.budget) - Number(playerLocked.price);
  await teamRepository.save(team, { transaction });

  await transferRepository.createTransfer(
    {
      player_id: playerLocked.id,
      from_team_id: null,
      to_team_id: team.id,
      price: playerLocked.price
    },
    { transaction }
  );

  await budgetLogRepository.createLog(
    {
      team_id: team.id,
      amount: -Number(playerLocked.price),
      type: 'DRAFT_PURCHASE',
      reason: `Draft round ${state.current_round}`,
      created_by_admin_id: adminId
    },
    { transaction }
  );

  const { isNewRound } = await stateManagerService.advanceDraftTurn({
    transaction,
    orderLength: order.length
  });

  if (isNewRound) {
    await draftOrderRepository.reorderPlayerDraftByBudget(transaction);
    // eslint-disable-next-line no-console
    console.log('[DRAFT] nuovo round: ordine ricalcolato per budget DESC');
  }

  const refreshedState = await leagueStateRepository.getForUpdate(transaction);
  const freshOrder = isNewRound ? await getDraftOrder({ transaction }) : order;
  const nextEntry = freshOrder[refreshedState.current_draft_turn] || null;

  return {
    player: playerLocked,
    team,
    spent: Number(playerLocked.price),
    remainingBudget: Number(team.budget),
    round: refreshedState.current_round,
    nextEntry,
    state: refreshedState
  };
}

async function pickPlayer({ discordUserId, discordUserCandidates = [], playerIdentifier }) {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.draft_status !== 'ACTIVE') {
      const hint = state.draft_status === 'PAUSED'
        ? `Il draft e in pausa. Usa ${env.prefix}continua per riprendere.`
        : `Il draft non e stato avviato. Usa ${env.prefix}iniziodraft.`;
      throw new ConflictError(hint);
    }

    const order = await getDraftOrder({ transaction });
    if (order.length === 0) {
      throw new NotFoundError('Ordine draft non trovato.');
    }

    const currentEntry = order[state.current_draft_turn];
    if (!currentEntry) {
      throw new ConflictError('Turno draft non valido.');
    }

    const turnCandidates = [discordUserId, ...discordUserCandidates]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    if (!turnCandidates.includes(currentEntry.discord_user_id)) {
      throw new ForbiddenError('Non e il tuo turno di draft.');
    }

    const result = await executeDraftPick({
      transaction,
      state,
      order,
      playerIdentifier,
      teamId: currentEntry.team_id,
      adminId: null
  });

    // eslint-disable-next-line no-console
    console.log(`[DRAFT] pick ${result.player.player_name} by ${result.team.name} for ${result.player.price}`);

    return result;
  });
}

async function staffPickPlayer({ playerIdentifier, adminId }) {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.draft_status !== 'ACTIVE') {
      const hint = state.draft_status === 'PAUSED'
        ? `Il draft e in pausa. Usa ${env.prefix}continua per riprendere.`
        : `Il draft non e stato avviato. Usa ${env.prefix}iniziodraft.`;
      throw new ConflictError(hint);
    }

    const order = await getDraftOrder({ transaction });
    if (order.length === 0) {
      throw new NotFoundError('Ordine draft non trovato.');
    }

    const currentEntry = order[state.current_draft_turn];
    if (!currentEntry) {
      throw new ConflictError('Turno draft non valido.');
    }

    const result = await executeDraftPick({
      transaction,
      state,
      order,
      playerIdentifier,
      teamId: currentEntry.team_id,
      adminId
    });

    // eslint-disable-next-line no-console
    console.log(`[DRAFT] staff pick ${result.player.player_name} for ${result.team.name} by admin ${adminId || 'N/A'}`);

    return result;
  });
}

module.exports = {
  startDraft,
  stopDraft,
  continueDraft,
  closeDraft,
  skipTurn,
  getCurrentTurnInfo,
  getDraftOrder,
  pickPlayer,
  staffPickPlayer
};



