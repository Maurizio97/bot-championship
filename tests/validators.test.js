const test = require('node:test');
const assert = require('node:assert/strict');

const { assertDiscordId, assertPositiveInteger } = require('../src/utils/validators');

test('assertPositiveInteger ritorna numero valido', () => {
  assert.equal(assertPositiveInteger('12', 'playerId'), 12);
});

test('assertPositiveInteger lancia errore su valore non valido', () => {
  assert.throws(() => assertPositiveInteger('abc', 'playerId'));
});

test('assertDiscordId accetta username Discord valido', () => {
  assert.equal(assertDiscordId('encke_'), 'encke_');
});

test('assertDiscordId rifiuta username Discord non valido', () => {
  assert.throws(() => assertDiscordId('bad username!'));
});

