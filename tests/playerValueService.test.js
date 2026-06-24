const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculatePlayerValue,
  getAgeMultiplier,
  getRoleMultiplier,
  getOverallBaseValue
} = require('../src/services/playerValueService');

test('getOverallBaseValue usa tabella richiesta e cap a 95+', () => {
  assert.equal(getOverallBaseValue(72), 3);
  assert.equal(getOverallBaseValue(90), 140);
  assert.equal(getOverallBaseValue(95), 315);
  assert.equal(getOverallBaseValue(99), 315);
});

test('getAgeMultiplier applica fasce eta corrette', () => {
  assert.equal(getAgeMultiplier(20), 1.35);
  assert.equal(getAgeMultiplier(23), 1.25);
  assert.equal(getAgeMultiplier(26), 1.15);
  assert.equal(getAgeMultiplier(29), 1);
  assert.equal(getAgeMultiplier(31), 0.85);
  assert.equal(getAgeMultiplier(33), 0.7);
  assert.equal(getAgeMultiplier(35), 0.55);
  assert.equal(getAgeMultiplier(36), 0.4);
});

test('getRoleMultiplier supporta ruoli singoli e composti', () => {
  assert.equal(getRoleMultiplier('POR'), 0.85);
  assert.equal(getRoleMultiplier('DC'), 0.95);
  assert.equal(getRoleMultiplier('TD / TS / ADA / ASA'), 0.9);
  assert.equal(getRoleMultiplier('AT / ATT'), 1.2);
  assert.equal(getRoleMultiplier('RW'), 1.15);
  assert.equal(getRoleMultiplier('RUOLO_SCONOSCIUTO'), 1);
});

test('calculatePlayerValue applica formula base*eta*ruolo', () => {
  const value = calculatePlayerValue({
    overall: 90,
    age: 24,
    role: 'AT'
  });

  assert.equal(value, Math.round(140 * 1.15 * 1.2));
});


