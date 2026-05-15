const test = require('node:test');
const assert = require('node:assert/strict');

const playerRepository = require('../src/repositories/playerRepository');
const playerService = require('../src/services/playerService');

test('findPlayerByIdentifierOrSuggest restituisce il giocatore quando il match e unico', async () => {
  const originalFindByName = playerRepository.findByName;

  playerRepository.findByName = async () => [{ id: 7, player_name: 'Rafael Leao', overall: 86 }];

  try {
    const player = await playerService.findPlayerByIdentifierOrSuggest('Leao');
    assert.equal(player.id, 7);
    assert.equal(player.player_name, 'Rafael Leao');
  } finally {
    playerRepository.findByName = originalFindByName;
  }
});

test('findPlayerByIdentifierOrSuggest suggerisce i primi risultati quando la ricerca e ambigua', async () => {
  const originalFindByName = playerRepository.findByName;

  playerRepository.findByName = async () => [
    { id: 1, player_name: 'Leo Messi', overall: 90, team: { name: 'Miami' } },
    { id: 2, player_name: 'Leon Bailey', overall: 82, team: null }
  ];

  try {
    await assert.rejects(
      () => playerService.findPlayerByIdentifierOrSuggest('Leo'),
      (error) => {
        assert.match(error.message, /Trovati piu giocatori/i);
        assert.match(error.message, /ID 1: Leo Messi/);
        assert.match(error.message, /ID 2: Leon Bailey/);
        return true;
      }
    );
  } finally {
    playerRepository.findByName = originalFindByName;
  }
});

test('findPlayerByIdentifierOrSuggest usa l\'ID quando viene passato un numero', async () => {
  const originalFindById = playerRepository.findById;

  playerRepository.findById = async (id) => ({ id, player_name: 'Kylian Mbappe', overall: 91 });

  try {
    const player = await playerService.findPlayerByIdentifierOrSuggest('15');
    assert.equal(player.id, 15);
    assert.equal(player.player_name, 'Kylian Mbappe');
  } finally {
    playerRepository.findById = originalFindById;
  }
});

