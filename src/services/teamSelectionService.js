const { sequelize } = require('../models');
const teamRepository = require('../repositories/teamRepository');
const draftOrderRepository = require('../repositories/draftOrderRepository');
const leagueStateRepository = require('../repositories/leagueStateRepository');
const { BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');

function shuffle(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

async function getSelectionOrder(options = {}) {
  return draftOrderRepository.findByType('TEAM_SELECTION', options);
}

async function startTeamSelection() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.team_selection_status === 'ACTIVE') {
      throw new ConflictError('Team selection gia attiva.');
    }

    const teams = await teamRepository.findAllOrdered();
    if (teams.length === 0) {
      throw new BadRequestError('Nessuna squadra registrata.');
    }

    const randomized = shuffle(teams);

    await draftOrderRepository.deleteByType('TEAM_SELECTION', { transaction });
    await draftOrderRepository.bulkCreate(
      randomized.map((team, index) => ({
        type: 'TEAM_SELECTION',
        discord_user_id: team.owner_discord_id,
        team_id: team.id,
        position: index
      })),
      { transaction }
    );

    state.team_selection_status = 'ACTIVE';
    state.current_team_selection_turn = 0;
    await state.save({ transaction });

    // eslint-disable-next-line no-console
    console.log(`[TEAM_SELECTION] started with ${randomized.length} teams`);

    return {
      state,
      order: await getSelectionOrder({ transaction })
    };
  });
}

async function stopTeamSelection() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.team_selection_status = 'PAUSED';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log(`[TEAM_SELECTION] paused at turn ${state.current_team_selection_turn}`);
    return state;
  });
}

async function continueTeamSelection() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.team_selection_status = 'ACTIVE';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log(`[TEAM_SELECTION] resumed at turn ${state.current_team_selection_turn}`);
    return state;
  });
}

async function closeTeamSelection() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    state.team_selection_status = 'CLOSED';
    await state.save({ transaction });
    // eslint-disable-next-line no-console
    console.log('[TEAM_SELECTION] closed');
    return state;
  });
}

async function selectClub({ discordUserId, discordUserCandidates = [], clubName }) {
  const normalizedClubName = String(clubName || '').trim();
  if (!normalizedClubName) {
    throw new BadRequestError('Nome club obbligatorio.');
  }

  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    if (state.team_selection_status !== 'ACTIVE') {
      throw new ConflictError('Team selection non attiva.');
    }

    const order = await getSelectionOrder({ transaction });
    const currentEntry = order[state.current_team_selection_turn];

    if (!currentEntry) {
      state.team_selection_status = 'CLOSED';
      await state.save({ transaction });
      throw new ConflictError('Ordine team selection completato.');
    }

    const turnCandidates = [discordUserId, ...discordUserCandidates]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    if (!turnCandidates.includes(currentEntry.discord_user_id)) {
      throw new ForbiddenError('Non e il tuo turno per scegliere la squadra.');
    }

    const team = await teamRepository.findByIdForUpdate(currentEntry.team_id, transaction);
    const alreadySelected = await teamRepository.findByNameInsensitive(normalizedClubName, { transaction });
    if (alreadySelected && alreadySelected.id !== team.id) {
      throw new ConflictError(`Il club ${normalizedClubName} e gia stato scelto.`);
    }

    team.name = normalizedClubName;
    await teamRepository.save(team, { transaction });

    state.current_team_selection_turn += 1;
    if (state.current_team_selection_turn >= order.length) {
      state.team_selection_status = 'CLOSED';
    }

    await state.save({ transaction });

    // eslint-disable-next-line no-console
    console.log(`[TEAM_SELECTION] team ${team.id} renamed to ${normalizedClubName}`);

    return {
      team,
      clubName: normalizedClubName,
      state,
      nextEntry: order[state.current_team_selection_turn] || null
    };
  });
}

module.exports = {
  startTeamSelection,
  stopTeamSelection,
  continueTeamSelection,
  closeTeamSelection,
  selectClub,
  getSelectionOrder
};



