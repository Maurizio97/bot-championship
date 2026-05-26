const test = require('node:test');
const assert = require('node:assert/strict');

const { sequelize } = require('../src/models');
const budgetLogRepository = require('../src/repositories/budgetLogRepository');
const playerRepository = require('../src/repositories/playerRepository');
const teamRepository = require('../src/repositories/teamRepository');
const transferRepository = require('../src/repositories/transferRepository');
const playerService = require('../src/services/playerService');
const teamService = require('../src/services/teamService');

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

test('buyFreePlayerForTeam blocca l\'acquisto se non resta budget minimo per completare la rosa', async () => {
  const originals = {
    transaction: sequelize.transaction,
    findByName: playerRepository.findByName,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    countByTeamId: playerRepository.countByTeamId,
    savePlayer: playerRepository.save,
    getTeamById: teamService.getTeamById,
    findTeamByIdForUpdate: teamRepository.findByIdForUpdate,
    saveTeam: teamRepository.save,
    createTransfer: transferRepository.createTransfer,
    createLog: budgetLogRepository.createLog
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  playerRepository.findByName = async () => ([{ id: 1, player_name: 'Test Player', overall: 80, team: null }]);
  playerRepository.findByIdForUpdate = async () => ({
    id: 1,
    player_name: 'Test Player',
    team_id: null,
    price: 5
  });
  playerRepository.countByTeamId = async () => 16;
  playerRepository.save = async () => {};
  teamService.getTeamById = async () => ({ id: 10, name: 'Team Test', budget: 7 });
  teamRepository.findByIdForUpdate = async () => ({ id: 10, name: 'Team Test', budget: 7 });
  teamRepository.save = async () => {};
  transferRepository.createTransfer = async () => {};
  budgetLogRepository.createLog = async () => {};

  try {
    await assert.rejects(
      () => playerService.buyFreePlayerForTeam({
        playerIdentifier: 'Test Player',
        toTeamId: 10,
        adminId: 'admin-1'
      }),
      (error) => {
        assert.match(error.message, /operazione non consentita/i);
        assert.match(error.message, /rosa minima di 18 giocatori/i);
        return true;
      }
    );
  } finally {
    sequelize.transaction = originals.transaction;
    playerRepository.findByName = originals.findByName;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.countByTeamId = originals.countByTeamId;
    playerRepository.save = originals.savePlayer;
    teamService.getTeamById = originals.getTeamById;
    teamRepository.findByIdForUpdate = originals.findTeamByIdForUpdate;
    teamRepository.save = originals.saveTeam;
    transferRepository.createTransfer = originals.createTransfer;
    budgetLogRepository.createLog = originals.createLog;
  }
});

test('releasePlayerFromTeam svincola il giocatore e rimborsa il budget della squadra', async () => {
  const originals = {
    transaction: sequelize.transaction,
    findByName: playerRepository.findByName,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    savePlayer: playerRepository.save,
    findTeamByIdForUpdate: teamRepository.findByIdForUpdate,
    saveTeam: teamRepository.save,
    createLog: budgetLogRepository.createLog
  };

  const savedPlayer = { value: null };
  const savedTeam = { value: null };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  playerRepository.findByName = async () => ([{ id: 7, player_name: 'Test Player', overall: 75, team: { id: 10 } }]);
  playerRepository.findByIdForUpdate = async () => ({
    id: 7,
    player_name: 'Test Player',
    team_id: 10,
    price: 25
  });
  playerRepository.save = async (player) => {
    savedPlayer.value = player;
  };
  teamRepository.findByIdForUpdate = async () => ({ id: 10, name: 'Team Test', budget: 100 });
  teamRepository.save = async (team) => {
    savedTeam.value = team;
  };
  budgetLogRepository.createLog = async () => {};

  try {
    const result = await playerService.releasePlayerFromTeam({
      playerIdentifier: 'Test Player',
      adminId: 'admin-1'
    });

    assert.equal(result.refunded, 25);
    assert.equal(result.newBudget, 125);
    assert.equal(savedPlayer.value.team_id, null);
    assert.equal(savedTeam.value.budget, 125);
  } finally {
    sequelize.transaction = originals.transaction;
    playerRepository.findByName = originals.findByName;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.save = originals.savePlayer;
    teamRepository.findByIdForUpdate = originals.findTeamByIdForUpdate;
    teamRepository.save = originals.saveTeam;
    budgetLogRepository.createLog = originals.createLog;
  }
});

