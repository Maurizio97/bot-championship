const stateManagerService = require('../services/stateManagerService');
const { ConflictError } = require('../utils/errors');

async function draftActiveMiddleware() {
  const state = await stateManagerService.getLeagueState();
  if (state.draft_status !== 'ACTIVE') {
    throw new ConflictError('Draft non attivo.');
  }

  return state;
}

module.exports = draftActiveMiddleware;

