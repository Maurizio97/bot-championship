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

async function updateTeamDetails({ teamId, newName, ownerDiscordId }) {
  if (!newName || !ownerDiscordId) {
    throw new BadRequestError('Nuovo nome squadra e owner Discord username sono obbligatori.');
  }

  const team = await getTeamById(teamId);
  const existingByName = await teamRepository.findByName(newName);

  if (existingByName && existingByName.id !== team.id) {
    throw new ConflictError(`La squadra ${newName} esiste gia.`);
  }

  team.name = newName;
  team.owner_discord_id = ownerDiscordId;

  return teamRepository.save(team);
}

async function listTeamRosters() {
  return teamRepository.findAllWithPlayers();
}

async function getTeamByOwnerCandidates(candidates) {
  const team = await teamRepository.findByOwnerDiscordCandidates(candidates);
  if (!team) {
    throw new NotFoundError('Nessuna squadra associata al tuo account.');
  }

  return team;
}

function buildOwnerCandidates(rawIdentifier) {
  const normalized = String(rawIdentifier || '').trim();
  if (!normalized) {
    return [];
  }

  const mentionMatch = normalized.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) {
    return [mentionMatch[1]];
  }

  const noAtPrefix = normalized.startsWith('@') ? normalized.slice(1).trim() : '';
  return noAtPrefix ? [normalized, noAtPrefix] : [normalized];
}

async function getRosterByTeamName(teamName) {
  const normalized = String(teamName || '').trim();
  if (!normalized) {
    throw new BadRequestError('Nome squadra o tag proprietario obbligatorio.');
  }

  const teamByIdentifier = await teamRepository.findByNameOrOwnerCandidates(normalized, buildOwnerCandidates(normalized));
  if (!teamByIdentifier) {
    throw new NotFoundError(`Squadra ${teamName} non trovata.`);
  }

  const all = await teamRepository.findAllWithPlayers();
  const team = all.find((item) => item.id === teamByIdentifier.id);

  if (!team) {
    throw new NotFoundError(`Squadra ${teamName} non trovata.`);
  }

  return team;
}

module.exports = {
  createTeam,
  getTeamById,
  updateTeamDetails,
  listTeamRosters,
  getTeamByOwnerCandidates,
  getRosterByTeamName
};

