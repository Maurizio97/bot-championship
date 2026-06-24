const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateSeasonGrowth,
  DEFAULT_PLAYER_AGE
} = require('../src/services/playerGrowthService');

test('calculateSeasonGrowth applica crescita per eta e bonus prestazione entro i limiti overall', () => {
  const result = calculateSeasonGrowth({
    oldOverall: 82,
    oldAge: 22,
    goals: 24,
    assists: 8
  });

  assert.equal(result.oldAge, 22);
  assert.equal(result.newAge, 23);
  assert.equal(result.growthApplied, 4);
  assert.equal(result.newOverall, 86);
});

test('calculateSeasonGrowth rispetta il limite +1 in fascia 85-90', () => {
  const result = calculateSeasonGrowth({
    oldOverall: 87,
    oldAge: 20,
    goals: 30,
    assists: 20
  });

  assert.equal(result.growthApplied, 1);
  assert.equal(result.newOverall, 88);
});

test('calculateSeasonGrowth non fa crescere giocatori 91+', () => {
  const result = calculateSeasonGrowth({
    oldOverall: 92,
    oldAge: 24,
    goals: 40,
    assists: 20
  });

  assert.equal(result.growthApplied <= 0, true);
  assert.equal(result.newOverall <= 92, true);
});

test('calculateSeasonGrowth usa eta di default se mancante', () => {
  const result = calculateSeasonGrowth({
    oldOverall: 75,
    oldAge: null,
    goals: 0,
    assists: 0
  });

  assert.equal(result.oldAge, DEFAULT_PLAYER_AGE);
  assert.equal(result.newAge, DEFAULT_PLAYER_AGE + 1);
});

