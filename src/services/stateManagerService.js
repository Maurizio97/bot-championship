const { sequelize } = require('../models');
const leagueStateRepository = require('../repositories/leagueStateRepository');
const { computeNextDraftState } = require('../utils/draftTurnManager');

async function getLeagueState() {
  return leagueStateRepository.getSingleton();
}

async function getCurrentDraftTurn() {
  const state = await getLeagueState();
  return state.current_draft_turn;
}

async function getCurrentRound() {
  const state = await getLeagueState();
  return state.current_round;
}

async function advanceDraftTurn({ transaction, orderLength }) {
  const state = await leagueStateRepository.getForUpdate(transaction);
  const { nextTurn, nextRound } = computeNextDraftState({
    currentTurn: state.current_draft_turn,
    currentRound: state.current_round,
    orderLength
  });

  const isNewRound = nextRound > state.current_round;

  state.current_draft_turn = nextTurn;
  state.current_round = nextRound;

  await state.save({ transaction });
  return { state, isNewRound };
}

async function pauseDraft() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.draft_status = 'PAUSED';
    await state.save({ transaction });
    return state;
  });
}

async function resumeDraft() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.draft_status = 'ACTIVE';
    await state.save({ transaction });
    return state;
  });
}

module.exports = {
  getLeagueState,
  getCurrentDraftTurn,
  getCurrentRound,
  advanceDraftTurn,
  pauseDraft,
  resumeDraft
};


