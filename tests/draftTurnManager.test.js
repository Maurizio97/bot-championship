const test = require('node:test');
const assert = require('node:assert/strict');

const { computeNextDraftState } = require('../src/utils/draftTurnManager');

test('computeNextDraftState avanza round quando turno supera ordine', () => {
  const next = computeNextDraftState({
    currentTurn: 3,
    currentRound: 2,
    orderLength: 4
  });

  assert.deepEqual(next, {
    nextTurn: 0,
    nextRound: 3
  });
});

