const teamRepository = require('../repositories/teamRepository');
const { DEFAULT_TEAM_BUDGET } = require('../config/constants');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

async function createTeam({ name, ownerDiscordId, budget = DEFAULT_TEAM_BUDGET }) {
  if (!name || !ownerDiscordId) {
    throw new BadRequestError('Nome squadra e owner Discord ID sono obbligatori.');
  }

  const existing = await teamRepository.findByName(name);
  if (existing) {
    throw new ConflictError(`La squadra ${name} esiste gia.`);
  }

  return teamRepository.createTeam({
    name,
    owner_discord_id: ownerDiscordId,
    budget
  });
}

async function getTeamById(id) {
  const team = await teamRepository.findById(id);

  if (!team) {
    throw new NotFoundError(`Squadra con ID ${id} non trovata.`);
  }

  return team;
}

module.exports = {
  createTeam,
  getTeamById
};

