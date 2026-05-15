const test = require('node:test');
const assert = require('node:assert/strict');

const { assertDiscordId, assertPositiveInteger } = require('../src/utils/validators');

test('assertPositiveInteger ritorna numero valido', () => {
  assert.equal(assertPositiveInteger('12', 'playerId'), 12);
});

test('assertPositiveInteger lancia errore su valore non valido', () => {
  assert.throws(() => assertPositiveInteger('abc', 'playerId'));
});

test('assertDiscordId accetta ID numerico', () => {
  assert.doesNotThrow(() => assertDiscordId('123456789'));
});

test('assertDiscordId rifiuta valore non numerico', () => {
  assert.throws(() => assertDiscordId('abc'));
});

