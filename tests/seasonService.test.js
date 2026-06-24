const test = require('node:test');
const assert = require('node:assert/strict');

const { sequelize } = require('../src/models');
const leagueStateRepository = require('../src/repositories/leagueStateRepository');
const overallHistoryRepository = require('../src/repositories/overallHistoryRepository');
const playerRepository = require('../src/repositories/playerRepository');
const seasonService = require('../src/services/seasonService');

test('createNewSeasonFromRows applica crescita eta a tutti e bonus solo ai giocatori nel CSV', async () => {
  const originals = {
    transaction: sequelize.transaction,
    getForUpdate: leagueStateRepository.getForUpdate,
    countBySeasonNumber: overallHistoryRepository.countBySeasonNumber,
    createEntry: overallHistoryRepository.createEntry,
    findAll: playerRepository.findAll,
    findByIds: playerRepository.findByIds,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    save: playerRepository.save
  };

  const savedPlayers = [];
  const createdHistory = [];

  const players = [
    { id: 1, player_name: 'Giocatore Bonus', overall: 80, age: 24, role: 'ST', price: 21 },
    { id: 2, player_name: 'Giocatore Solo Eta', overall: 80, age: 24, role: 'ST', price: 21 }
  ];

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  leagueStateRepository.getForUpdate = async () => ({
    current_season_number: 1,
    async save() {
      return this;
    }
  });
  overallHistoryRepository.countBySeasonNumber = async () => 0;
  overallHistoryRepository.createEntry = async (payload) => {
    createdHistory.push(payload);
    return payload;
  };
  playerRepository.findAll = async () => players.map((player) => ({ ...player }));
  playerRepository.findByIds = async (ids) => players.filter((player) => ids.includes(player.id)).map((player) => ({ ...player }));
  playerRepository.findByIdForUpdate = async (id) => ({ ...players.find((player) => player.id === id) });
  playerRepository.save = async (player) => {
    savedPlayers.push({ ...player });
    return player;
  };

  try {
    const result = await seasonService.createNewSeasonFromRows({
      rows: [{ lineNumber: 2, player_id: '1', player_name: '', goals: '20', assists: '8' }]
    });

    assert.equal(result.previousSeason, 1);
    assert.equal(result.newSeason, 2);
    assert.equal(result.updatedPlayers, 2);

    const bonusPlayerHistory = createdHistory.find((item) => item.player_id === 1);
    const ageOnlyPlayerHistory = createdHistory.find((item) => item.player_id === 2);
    assert.equal(bonusPlayerHistory.goals, 20);
    assert.equal(bonusPlayerHistory.assists, 8);
    assert.equal(ageOnlyPlayerHistory.goals, 0);
    assert.equal(ageOnlyPlayerHistory.assists, 0);

    const bonusPlayerSaved = savedPlayers.find((item) => item.id === 1);
    const ageOnlyPlayerSaved = savedPlayers.find((item) => item.id === 2);
    assert.equal(bonusPlayerSaved.age, 25);
    assert.equal(ageOnlyPlayerSaved.age, 25);
  } finally {
    sequelize.transaction = originals.transaction;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
    overallHistoryRepository.countBySeasonNumber = originals.countBySeasonNumber;
    overallHistoryRepository.createEntry = originals.createEntry;
    playerRepository.findAll = originals.findAll;
    playerRepository.findByIds = originals.findByIds;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.save = originals.save;
  }
});

test('rollbackCurrentSeason ripristina i valori player e decrementa la stagione', async () => {
  const originals = {
    transaction: sequelize.transaction,
    getForUpdate: leagueStateRepository.getForUpdate,
    findBySeasonNumber: overallHistoryRepository.findBySeasonNumber,
    deleteBySeasonNumber: overallHistoryRepository.deleteBySeasonNumber,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    save: playerRepository.save
  };

  const savedPlayers = [];

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  leagueStateRepository.getForUpdate = async () => ({
    current_season_number: 3,
    async save() {
      return this;
    }
  });
  overallHistoryRepository.findBySeasonNumber = async () => ([
    { id: 11, player_id: 1, old_overall: 81, old_age: 24, old_price: 95 },
    { id: 12, player_id: 2, old_overall: 77, old_age: 29, old_price: 61 }
  ]);
  overallHistoryRepository.deleteBySeasonNumber = async () => 2;
  playerRepository.findByIdForUpdate = async (id) => ({ id, overall: 99, age: 99, price: 999 });
  playerRepository.save = async (player) => {
    savedPlayers.push({ ...player });
    return player;
  };

  try {
    const result = await seasonService.rollbackCurrentSeason();

    assert.equal(result.rolledBackSeason, 3);
    assert.equal(result.currentSeason, 2);
    assert.equal(result.restoredPlayers, 2);
    assert.equal(result.deletedHistoryRows, 2);

    assert.equal(savedPlayers[0].overall, 81);
    assert.equal(savedPlayers[0].age, 24);
    assert.equal(savedPlayers[0].price, 95);
  } finally {
    sequelize.transaction = originals.transaction;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
    overallHistoryRepository.findBySeasonNumber = originals.findBySeasonNumber;
    overallHistoryRepository.deleteBySeasonNumber = originals.deleteBySeasonNumber;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.save = originals.save;
  }
});

test('rollbackCurrentSeason blocca il rollback quando la stagione corrente e 1', async () => {
  const originals = {
    transaction: sequelize.transaction,
    getForUpdate: leagueStateRepository.getForUpdate
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  leagueStateRepository.getForUpdate = async () => ({
    current_season_number: 1,
    async save() {
      return this;
    }
  });

  try {
    await assert.rejects(
      () => seasonService.rollbackCurrentSeason(),
      (error) => {
        assert.match(error.message, /rollback non consentito/i);
        return true;
      }
    );
  } finally {
    sequelize.transaction = originals.transaction;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
  }
});

