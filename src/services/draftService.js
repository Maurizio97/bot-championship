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
      throw new ConflictError('Draft non attivo.');
    }

    const order = await getDraftOrder({ transaction });
    if (order.length === 0) {
      throw new NotFoundError(`Ordine draft non trovato. Avvia prima ${env.prefix}iniziodraft.`);
    }

    await stateManagerService.advanceDraftTurn({
      transaction,
      orderLength: order.length
    });

    return {
      order,
      state: await leagueStateRepository.getForUpdate(transaction)
    };
  });
}

async function pickPlayer({ discordUserId, discordUserCandidates = [], playerIdentifier }) {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.draft_status !== 'ACTIVE') {
      throw new ConflictError('Draft non attivo.');
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

    const player = await playerService.findPlayerByIdentifierOrSuggest(playerIdentifier);
    const playerLocked = await playerRepository.findByIdForUpdate(player.id, transaction);

    if (playerLocked.team_id) {
      throw new ConflictError(`Il giocatore ${playerLocked.player_name} e gia assegnato.`);
    }

    const team = await teamRepository.findByIdForUpdate(currentEntry.team_id, transaction);
    if (!team) {
      throw new NotFoundError('Squadra di turno non trovata.');
    }

    if (Number(team.budget) < Number(playerLocked.price)) {
      throw new ConflictError(`Budget insufficiente. Costo ${playerLocked.price}, disponibile ${team.budget}.`);
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
        price: playerLocked.price,
        created_by_admin_id: null
      },
      { transaction }
    );

    await budgetLogRepository.createLog(
      {
        team_id: team.id,
        amount: -Number(playerLocked.price),
        type: 'DRAFT_PURCHASE',
        reason: `Draft round ${state.current_round}`,
        created_by_admin_id: null
      },
      { transaction }
    );

    await stateManagerService.advanceDraftTurn({
      transaction,
      orderLength: order.length
    });

    const refreshedState = await leagueStateRepository.getForUpdate(transaction);
    const nextEntry = order[refreshedState.current_draft_turn] || null;

    // eslint-disable-next-line no-console
    console.log(`[DRAFT] pick ${playerLocked.player_name} by ${team.name} for ${playerLocked.price}`);

    return {
      player: playerLocked,
      team,
      spent: Number(playerLocked.price),
      remainingBudget: Number(team.budget),
      round: refreshedState.current_round,
      nextEntry,
      state: refreshedState
    };
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
  pickPlayer
};



