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

test('findFreePlayers applica filtro role case-insensitive con prefisso', async () => {
  const originalFindAndCountAll = Player.findAndCountAll;

  Player.findAndCountAll = async (options) => {
    assert.equal(options.limit, 20);
    assert.equal(options.offset, 0);
    assert.equal(options.where.team_id, null);
    assert.ok(options.where, 'La query deve includere where');
    assert.deepEqual(options.order, [
      ['overall', 'DESC'],
      ['player_name', 'ASC'],
      ['id', 'ASC']
    ]);
    return { count: 0, rows: [] };
  };

  try {
    await playerRepository.findFreePlayers({ role: 'AtT', limit: 20, offset: 0 });
  } finally {
    Player.findAndCountAll = originalFindAndCountAll;
  }
});

test('findTakenPlayers applica filtro role case-insensitive con prefisso', async () => {
  const originalFindAndCountAll = Player.findAndCountAll;

  Player.findAndCountAll = async (options) => {
    assert.equal(options.limit, 10);
    assert.equal(options.offset, 20);
    assert.ok(options.where.team_id, 'La query deve filtrare solo giocatori assegnati');
    assert.deepEqual(options.order, [
      ['overall', 'DESC'],
      ['player_name', 'ASC'],
      ['id', 'ASC']
    ]);
    return { count: 0, rows: [] };
  };

  try {
    await playerRepository.findTakenPlayers({ role: 'PoR', limit: 10, offset: 20 });
  } finally {
    Player.findAndCountAll = originalFindAndCountAll;
  }
});
