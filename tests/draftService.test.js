const test = require('node:test');
const assert = require('node:assert/strict');

const { sequelize } = require('../src/models');
const draftService = require('../src/services/draftService');

const draftOrderRepository = require('../src/repositories/draftOrderRepository');
const leagueStateRepository = require('../src/repositories/leagueStateRepository');
const playerRepository = require('../src/repositories/playerRepository');
const teamRepository = require('../src/repositories/teamRepository');
const transferRepository = require('../src/repositories/transferRepository');
const budgetLogRepository = require('../src/repositories/budgetLogRepository');
const stateManagerService = require('../src/services/stateManagerService');
const playerService = require('../src/services/playerService');

test('pickPlayer blocca la scelta se non resta budget minimo per completare 18 giocatori', async () => {
  const originals = {
    transaction: sequelize.transaction,
    getForUpdate: leagueStateRepository.getForUpdate,
    findByType: draftOrderRepository.findByType,
    findPlayerByIdentifierOrSuggest: playerService.findPlayerByIdentifierOrSuggest,
    findByIdForUpdate: playerRepository.findByIdForUpdate,
    countByTeamId: playerRepository.countByTeamId,
    savePlayer: playerRepository.save,
    findTeamByIdForUpdate: teamRepository.findByIdForUpdate,
    saveTeam: teamRepository.save,
    createTransfer: transferRepository.createTransfer,
    createLog: budgetLogRepository.createLog,
    advanceDraftTurn: stateManagerService.advanceDraftTurn
  };

  sequelize.transaction = async (work) => work({ LOCK: { UPDATE: 'UPDATE' } });
  leagueStateRepository.getForUpdate = async () => ({
    draft_status: 'ACTIVE',
    current_draft_turn: 0,
    current_round: 1
  });
  draftOrderRepository.findByType = async () => ([
    { discord_user_id: 'user-1', team_id: 10 }
  ]);

  playerService.findPlayerByIdentifierOrSuggest = async () => ({ id: 99, player_name: 'Test Player' });
  playerRepository.findByIdForUpdate = async () => ({
    id: 99,
    player_name: 'Test Player',
    team_id: null,
    price: 5
  });

  // La squadra ha 16 giocatori: dopo il pick diventano 17 e ne manca 1 (min 3).
  // Con budget 7 e acquisto a 5 restano 2, quindi deve bloccare.
  playerRepository.countByTeamId = async () => 16;
  playerRepository.save = async () => {};

  teamRepository.findByIdForUpdate = async () => ({
    id: 10,
    name: 'Team Test',
    budget: 7
  });
  teamRepository.save = async () => {};

  transferRepository.createTransfer = async () => {};
  budgetLogRepository.createLog = async () => {};
  stateManagerService.advanceDraftTurn = async () => ({ isNewRound: false });

  try {
    await assert.rejects(
      () => draftService.pickPlayer({
        discordUserId: 'user-1',
        discordUserCandidates: [],
        playerIdentifier: 'Test Player'
      }),
      (error) => {
        assert.match(error.message, /operazione non consentita/i);
        assert.match(error.message, /rosa minima di 18 giocatori/i);
        return true;
      }
    );
  } finally {
    sequelize.transaction = originals.transaction;
    leagueStateRepository.getForUpdate = originals.getForUpdate;
    draftOrderRepository.findByType = originals.findByType;
    playerService.findPlayerByIdentifierOrSuggest = originals.findPlayerByIdentifierOrSuggest;
    playerRepository.findByIdForUpdate = originals.findByIdForUpdate;
    playerRepository.countByTeamId = originals.countByTeamId;
    playerRepository.save = originals.savePlayer;
    teamRepository.findByIdForUpdate = originals.findTeamByIdForUpdate;
    teamRepository.save = originals.saveTeam;
    transferRepository.createTransfer = originals.createTransfer;
    budgetLogRepository.createLog = originals.createLog;
    stateManagerService.advanceDraftTurn = originals.advanceDraftTurn;
  }
});

