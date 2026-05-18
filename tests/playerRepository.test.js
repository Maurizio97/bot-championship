const test = require('node:test');
const assert = require('node:assert/strict');

const { Player } = require('../src/models');
const playerRepository = require('../src/repositories/playerRepository');
const { normalizeSearchText } = require('../src/utils/textSearch');

test('normalizeSearchText rimuove accenti e caratteri speciali', () => {
  assert.equal(normalizeSearchText('Kylian Mbappé'), 'kylian mbappe');
  assert.equal(normalizeSearchText(' João-Félix '), 'joao felix');
});

test('findByName trova giocatori anche senza accenti', async () => {
  const originalFindAll = Player.findAll;

  Player.findAll = async () => [
    { id: 10, player_name: 'Kylian Mbappé', overall: 91, team: null },
    { id: 11, player_name: 'Erling Haaland', overall: 91, team: null }
  ];

  try {
    const matches = await playerRepository.findByName('Mbappe', 10);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].player_name, 'Kylian Mbappé');
  } finally {
    Player.findAll = originalFindAll;
  }
});

test('findByExactName trova match esatto ignorando accenti', async () => {
  const originalFindAll = Player.findAll;

  Player.findAll = async () => [
    { id: 12, player_name: 'João Félix', overall: 84, team: null }
  ];

  try {
    const player = await playerRepository.findByExactName('Joao Felix');
    assert.ok(player);
    assert.equal(player.id, 12);
  } finally {
    Player.findAll = originalFindAll;
  }
});

