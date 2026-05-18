const test = require('node:test');
const assert = require('node:assert/strict');

const teamRepository = require('../src/repositories/teamRepository');
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

