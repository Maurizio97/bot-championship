const test = require('node:test');
const assert = require('node:assert/strict');

const { assertDiscordId, assertDiscordTag, assertPositiveInteger } = require('../src/utils/validators');

test('assertPositiveInteger ritorna numero valido', () => {
  assert.equal(assertPositiveInteger('12', 'playerId'), 12);
});

test('assertPositiveInteger lancia errore su valore non valido', () => {
  assert.throws(() => assertPositiveInteger('abc', 'playerId'));
});

test('assertDiscordId accetta username Discord valido', () => {
  assert.equal(assertDiscordId('encke_'), 'encke_');
});

test('assertDiscordId accetta Discord snowflake valido', () => {
  assert.equal(assertDiscordId('12345678901234567'), '12345678901234567');
});

test('assertDiscordId accetta mention Discord valida', () => {
  assert.equal(assertDiscordId('<@12345678901234567>'), '12345678901234567');
  assert.equal(assertDiscordId('<@!12345678901234567>'), '12345678901234567');
});

test('assertDiscordId rifiuta username Discord non valido', () => {
  assert.throws(() => assertDiscordId('bad username!'));
});

test('assertDiscordTag accetta mention Discord e ritorna ID', () => {
  assert.equal(assertDiscordTag('<@12345678901234567>'), '12345678901234567');
  assert.equal(assertDiscordTag('<@!12345678901234567>'), '12345678901234567');
});

test('assertDiscordTag rifiuta input non mention', () => {
  assert.throws(() => assertDiscordTag('encke_'));
  assert.throws(() => assertDiscordTag('12345678901234567'));
});

