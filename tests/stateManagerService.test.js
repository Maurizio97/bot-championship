const test = require('node:test');
const assert = require('node:assert/strict');

const leagueStateRepository = require('../src/repositories/leagueStateRepository');
const stateManagerService = require('../src/services/stateManagerService');

test('advanceDraftTurn incrementa round quando termina ordine', async () => {
  const originalGetForUpdate = leagueStateRepository.getForUpdate;

  const fakeState = {
    current_draft_turn: 2,
    current_round: 3,
    async save() {
      return this;
    }
  };

  leagueStateRepository.getForUpdate = async () => fakeState;

  try {
    const result = await stateManagerService.advanceDraftTurn({
      transaction: { LOCK: { UPDATE: 'UPDATE' } },
      orderLength: 3
    });

    assert.equal(fakeState.current_draft_turn, 0);
    assert.equal(fakeState.current_round, 4);
    assert.equal(result.isNewRound, true);
    assert.equal(result.state, fakeState);
  } finally {
    leagueStateRepository.getForUpdate = originalGetForUpdate;
  }
});

test('advanceDraftTurn NON incrementa round quando turno non e ultimo', async () => {
  const originalGetForUpdate = leagueStateRepository.getForUpdate;

  const fakeState = {
    current_draft_turn: 1,
    current_round: 2,
    async save() {
      return this;
    }
  };

  leagueStateRepository.getForUpdate = async () => fakeState;

  try {
    const result = await stateManagerService.advanceDraftTurn({
      transaction: { LOCK: { UPDATE: 'UPDATE' } },
      orderLength: 4
    });

    assert.equal(fakeState.current_draft_turn, 2);
    assert.equal(fakeState.current_round, 2);
    assert.equal(result.isNewRound, false);
  } finally {
    leagueStateRepository.getForUpdate = originalGetForUpdate;
  }
});

