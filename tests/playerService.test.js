const test = require('node:test');
const assert = require('node:assert/strict');

const { sequelize } = require('../src/models');
const budgetLogRepository = require('../src/repositories/budgetLogRepository');
const leagueStateRepository = require('../src/repositories/leagueStateRepository');
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

test('buyFreePlayerForTeam applica prezzo d assegnazione personalizzato', async () => {
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

  const saved = {
    player: null,
    team: null,
    transfer: null,
    logs: []
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  playerRepository.findByName = async () => ([{ id: 3, player_name: 'Auction Player', overall: 82, team: null }]);
  playerRepository.findByIdForUpdate = async () => ({
    id: 3,
    player_name: 'Auction Player',
    team_id: null,
    price: 12
  });
  playerRepository.countByTeamId = async () => 16;
  playerRepository.save = async (player) => {
    saved.player = player;
  };
  teamService.getTeamById = async () => ({ id: 10, name: 'Team Test', budget: 100 });
  teamRepository.findByIdForUpdate = async () => ({ id: 10, name: 'Team Test', budget: 100 });
  teamRepository.save = async (team) => {
    saved.team = team;
  };
  transferRepository.createTransfer = async (transfer) => {
    saved.transfer = transfer;
  };
  budgetLogRepository.createLog = async (log) => {
    saved.logs.push(log);
  };

  try {
    const result = await playerService.buyFreePlayerForTeam({
      playerIdentifier: 'Auction Player',
      toTeamId: 10,
      adminId: 'admin-1',
      purchasePrice: 35
    });

    assert.equal(result.spent, 35);
    assert.equal(result.remainingBudget, 65);
    assert.equal(saved.player.price, 35);
    assert.equal(saved.player.team_id, 10);
    assert.equal(saved.team.budget, 65);
    assert.equal(saved.transfer.price, 35);
    assert.equal(saved.logs[0].amount, -35);
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

test('transferPlayerBetweenTeams blocca l\'operazione quando il mercato e chiuso', async () => {
  const originals = {
    transaction: sequelize.transaction,
    findByName: playerRepository.findByName,
    getForUpdate: leagueStateRepository.getForUpdate
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  playerRepository.findByName = async () => ([{ id: 1, player_name: 'Test Player', overall: 80, team: { id: 10 } }]);
  leagueStateRepository.getForUpdate = async () => ({ market_status: 'CLOSED' });

  try {
    await assert.rejects(
      () => playerService.transferPlayerBetweenTeams({
        playerIdentifier: 'Test Player',
        price: 0,
        fromTeamId: 10,
        toTeamId: 11,
        actorDiscordId: '123'
      }),
      (error) => {
        assert.match(error.message, /mercato e chiuso/i);
        return true;
      }
    );
  } finally {
    sequelize.transaction = originals.transaction;
    playerRepository.findByName = originals.findByName;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
  }
});

test('transferPlayerBetweenTeams gestisce prezzo 0 e aggiorna trasferimento e budget', async () => {
  const originals = {
    transaction: sequelize.transaction,
    findByName: playerRepository.findByName,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    countByTeamId: playerRepository.countByTeamId,
    savePlayer: playerRepository.save,
    findTeamByIdForUpdate: teamRepository.findByIdForUpdate,
    saveTeam: teamRepository.save,
    createTransfer: transferRepository.createTransfer,
    createLog: budgetLogRepository.createLog,
    getForUpdate: leagueStateRepository.getForUpdate
  };

  const saved = {
    player: null,
    teams: [],
    transfer: null,
    logs: []
  };

  const teamsById = {
    10: { id: 10, name: 'Team A', budget: 50 },
    11: { id: 11, name: 'Team B', budget: 20 }
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  playerRepository.findByName = async () => ([{ id: 7, player_name: 'Test Player', overall: 75, team: { id: 10 } }]);
  leagueStateRepository.getForUpdate = async () => ({ market_status: 'OPEN' });
  playerRepository.findByIdForUpdate = async () => ({
    id: 7,
    player_name: 'Test Player',
    team_id: 10,
    price: 40
  });
  teamRepository.findByIdForUpdate = async (teamId) => teamsById[teamId] || null;
  playerRepository.countByTeamId = async () => 17;
  playerRepository.save = async (player) => {
    saved.player = player;
  };
  teamRepository.save = async (team) => {
    saved.teams.push({ id: team.id, budget: team.budget });
  };
  transferRepository.createTransfer = async (payload) => {
    saved.transfer = payload;
  };
  budgetLogRepository.createLog = async (payload) => {
    saved.logs.push(payload);
  };

  try {
    const result = await playerService.transferPlayerBetweenTeams({
      playerIdentifier: 'Test Player',
      price: 0,
      fromTeamId: 10,
      toTeamId: 11,
      actorDiscordId: '123'
    });

    assert.equal(saved.player.team_id, 11);
    assert.equal(saved.transfer.price, 0);
    assert.equal(saved.logs.length, 2);
    assert.equal(saved.logs[0].amount, 0);
    assert.equal(saved.logs[1].amount, 0);
    assert.equal(result.fromRemainingBudget, 50);
    assert.equal(result.toRemainingBudget, 20);
  } finally {
    sequelize.transaction = originals.transaction;
    playerRepository.findByName = originals.findByName;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.countByTeamId = originals.countByTeamId;
    playerRepository.save = originals.savePlayer;
    teamRepository.findByIdForUpdate = originals.findTeamByIdForUpdate;
    teamRepository.save = originals.saveTeam;
    transferRepository.createTransfer = originals.createTransfer;
    budgetLogRepository.createLog = originals.createLog;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
  }
});
