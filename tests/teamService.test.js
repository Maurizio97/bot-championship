const test = require('node:test');
const assert = require('node:assert/strict');

const { sequelize } = require('../src/models');
const teamRepository = require('../src/repositories/teamRepository');
const transferRepository = require('../src/repositories/transferRepository');
const teamService = require('../src/services/teamService');

test('createTeam rifiuta un owner gia associato a un team', async () => {
  const originalFindByName = teamRepository.findByName;
  const originalFindByOwnerDiscordId = teamRepository.findByOwnerDiscordId;

  teamRepository.findByName = async () => null;
  teamRepository.findByOwnerDiscordId = async () => ({ id: 2, owner_discord_id: 'owner-1' });

  try {
    await assert.rejects(
      () => teamService.createTeam({ name: 'Nuova Squadra', ownerDiscordId: 'owner-1' }),
      (error) => {
        assert.match(error.message, /L'owner @owner-1 ha gia una squadra registrata\./i);
        return true;
      }
    );
  } finally {
    teamRepository.findByName = originalFindByName;
    teamRepository.findByOwnerDiscordId = originalFindByOwnerDiscordId;
  }
});

test('updateTeamDetails rifiuta un owner gia associato a un altro team', async () => {
  const originalFindById = teamRepository.findById;
  const originalFindByName = teamRepository.findByName;
  const originalFindByOwnerDiscordId = teamRepository.findByOwnerDiscordId;

  teamRepository.findById = async () => ({ id: 1, name: 'Team A', owner_discord_id: 'owner-a' });
  teamRepository.findByName = async () => null;
  teamRepository.findByOwnerDiscordId = async () => ({ id: 2, owner_discord_id: 'owner-b' });

  try {
    await assert.rejects(
      () => teamService.updateTeamDetails({ teamId: 1, newName: 'Team A+', ownerDiscordId: '1369003909376512140' }),
      (error) => {
        assert.match(error.message, /L'owner <@1369003909376512140> ha gia una squadra registrata\./i);
        return true;
      }
    );
  } finally {
    teamRepository.findById = originalFindById;
    teamRepository.findByName = originalFindByName;
    teamRepository.findByOwnerDiscordId = originalFindByOwnerDiscordId;
  }
});

test('deleteTeamById elimina la squadra esistente', async () => {
  const originalTransaction = sequelize.transaction;
  const originalFindByIdForUpdate = teamRepository.findByIdForUpdate;
  const originalDestroy = teamRepository.destroy;
  const originalDeleteByTeamId = transferRepository.deleteByTeamId;

  const existingTeam = { id: 7, name: 'Team Z', owner_discord_id: 'owner-z' };
  let deletedTeam = null;
  let deletedTransfersForTeamId = null;

  sequelize.transaction = async (callback) => callback({ id: 'tx-delete-team' });
  teamRepository.findByIdForUpdate = async () => existingTeam;
  transferRepository.deleteByTeamId = async (teamId) => {
    deletedTransfersForTeamId = teamId;
  };
  teamRepository.destroy = async (team) => {
    deletedTeam = team;
  };

  try {
    const removed = await teamService.deleteTeamById(7);
    assert.equal(removed.id, 7);
    assert.equal(deletedTransfersForTeamId, 7);
    assert.equal(deletedTeam, existingTeam);
  } finally {
    sequelize.transaction = originalTransaction;
    teamRepository.findByIdForUpdate = originalFindByIdForUpdate;
    transferRepository.deleteByTeamId = originalDeleteByTeamId;
    teamRepository.destroy = originalDestroy;
  }
});

test('deleteTeamById rifiuta quando la squadra non esiste', async () => {
  const originalTransaction = sequelize.transaction;
  const originalFindByIdForUpdate = teamRepository.findByIdForUpdate;

  sequelize.transaction = async (callback) => callback({ id: 'tx-delete-team' });
  teamRepository.findByIdForUpdate = async () => null;

  try {
    await assert.rejects(
      () => teamService.deleteTeamById(8),
      (error) => {
        assert.match(error.message, /Squadra con ID 8 non trovata\./i);
        return true;
      }
    );
  } finally {
    sequelize.transaction = originalTransaction;
    teamRepository.findByIdForUpdate = originalFindByIdForUpdate;
  }
});
