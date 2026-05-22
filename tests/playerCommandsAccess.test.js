const test = require('node:test');
const assert = require('node:assert/strict');

const giocatoriiberi = require('../src/commands/giocatoriiberi');
const giocatoripresi = require('../src/commands/giocatoripresi');
const playerRepository = require('../src/repositories/playerRepository');

test('il comando giocatoriiberi e accessibile agli utenti normali', () => {
  assert.equal(giocatoriiberi.adminOnly, false);
});

test('il comando giocatoripresi e accessibile agli utenti normali', () => {
  assert.equal(giocatoripresi.adminOnly, false);
});

test('il comando giocatoriiberi ha gli alias corretti', () => {
  assert.deepEqual(giocatoriiberi.aliases, ['liberi', 'svincolati']);
});

test('il comando giocatoripresi ha gli alias corretti', () => {
  assert.deepEqual(giocatoripresi.aliases, ['presi', 'assegnati']);
});

test('il comando giocatoriiberi supporta filtro per ruolo', async () => {
  const originalFindFree = playerRepository.findFreePlayers;

  playerRepository.findFreePlayers = async (options) => {
    assert.equal(options.role, 'Attaccante', 'Deve filtrare per il ruolo specificato');
    return {
      players: [
        { id: 1, player_name: 'Ronaldo', role: 'Attaccante', overall: 95, team: null }
      ],
      total: 1,
      limit: 20,
      offset: 0,
      pages: 1
    };
  };

  try {
    const mockMessage = {
      reply: async () => {}
    };

    await giocatoriiberi.execute(mockMessage, ['Attaccante']);
  } finally {
    playerRepository.findFreePlayers = originalFindFree;
  }
});

test('il comando giocatoriiberi supporta paginazione con flag', async () => {
  const originalFindFree = playerRepository.findFreePlayers;

  playerRepository.findFreePlayers = async (options) => {
    assert.equal(options.limit, 10, 'Deve usare per-page=10');
    assert.equal(options.offset, 10, 'Deve usare offset per page 2');
    return {
      players: [],
      total: 0,
      limit: 10,
      offset: 10,
      pages: 0
    };
  };

  try {
    const mockMessage = {
      reply: async () => {}
    };

    await giocatoriiberi.execute(mockMessage, ['--page=2', '--per-page=10']);
  } finally {
    playerRepository.findFreePlayers = originalFindFree;
  }
});

test('il comando giocatoripresi supporta paginazione con flag', async () => {
  const originalFindTaken = playerRepository.findTakenPlayers;

  playerRepository.findTakenPlayers = async (options) => {
    assert.equal(options.limit, 15, 'Deve usare per-page=15');
    assert.equal(options.offset, 30, 'Deve usare offset per page 3');
    return {
      players: [],
      total: 0,
      limit: 15,
      offset: 30,
      pages: 0
    };
  };

  try {
    const mockMessage = {
      reply: async () => {}
    };

    await giocatoripresi.execute(mockMessage, ['--page=3', '--per-page=15']);
  } finally {
    playerRepository.findTakenPlayers = originalFindTaken;
  }
});

test('il comando giocatoripresi supporta filtro per ruolo', async () => {
  const originalFindTaken = playerRepository.findTakenPlayers;

  playerRepository.findTakenPlayers = async (options) => {
    assert.equal(options.role, 'att', 'Deve passare il filtro ruolo al repository');
    return {
      players: [],
      total: 0,
      limit: 20,
      offset: 0,
      pages: 0
    };
  };

  try {
    const mockMessage = {
      reply: async () => {}
    };

    await giocatoripresi.execute(mockMessage, ['att']);
  } finally {
    playerRepository.findTakenPlayers = originalFindTaken;
  }
});

