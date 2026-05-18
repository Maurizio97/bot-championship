const test = require('node:test');
const assert = require('node:assert/strict');

const teamRepository = require('../src/repositories/teamRepository');
const teamService = require('../src/services/teamService');
const budgetService = require('../src/services/budgetService');

test('getRosterByTeamName accetta owner in formato mention', async () => {
  const originalFindByNameOrOwnerCandidates = teamRepository.findByNameOrOwnerCandidates;
  const originalFindAllWithPlayers = teamRepository.findAllWithPlayers;

  const rosterTeam = { id: 9, name: 'Falchi', owner_discord_id: '12345678901234567', players: [] };

  teamRepository.findByNameOrOwnerCandidates = async () => ({ id: 9 });
  teamRepository.findAllWithPlayers = async () => [rosterTeam];

  try {
    const team = await teamService.getRosterByTeamName('<@12345678901234567>');
    assert.equal(team.id, 9);
    assert.equal(team.name, 'Falchi');
  } finally {
    teamRepository.findByNameOrOwnerCandidates = originalFindByNameOrOwnerCandidates;
    teamRepository.findAllWithPlayers = originalFindAllWithPlayers;
  }
});

test('getTeamBudgetInfoByName accetta owner in formato @username', async () => {
  const originalFindByNameOrOwnerCandidates = teamRepository.findByNameOrOwnerCandidates;
  const originalFindAllWithPlayers = teamRepository.findAllWithPlayers;

  const teamRow = { id: 4, name: 'Lupi', budget: 250, owner_discord_id: 'proprietario' };
  const hydrated = {
    ...teamRow,
    players: [{ price: 80 }, { price: 50 }]
  };

  teamRepository.findByNameOrOwnerCandidates = async () => teamRow;
  teamRepository.findAllWithPlayers = async () => [hydrated];

  try {
    const info = await budgetService.getTeamBudgetInfoByName('@proprietario');
    assert.equal(info.team.id, 4);
    assert.equal(info.totalPlayers, 2);
    assert.equal(info.rosterValue, 130);
    assert.equal(info.budget, 250);
  } finally {
    teamRepository.findByNameOrOwnerCandidates = originalFindByNameOrOwnerCandidates;
    teamRepository.findAllWithPlayers = originalFindAllWithPlayers;
  }
});

