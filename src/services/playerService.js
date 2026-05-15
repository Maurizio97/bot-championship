const { sequelize } = require('../models');
const playerRepository = require('../repositories/playerRepository');
const transferRepository = require('../repositories/transferRepository');
const teamService = require('./teamService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function assignPlayerToTeam({ playerId, toTeamId, adminId }) {
  if (!Number.isInteger(playerId) || !Number.isInteger(toTeamId)) {
    throw new BadRequestError('playerId e teamId devono essere numeri interi.');
  }

  const player = await playerRepository.findById(playerId);
  if (!player) {
    throw new NotFoundError(`Giocatore con ID ${playerId} non trovato.`);
  }

  const toTeam = await teamService.getTeamById(toTeamId);
  const fromTeamId = player.team_id;

  if (fromTeamId === toTeam.id) {
    throw new BadRequestError('Il giocatore appartiene gia a questa squadra.');
  }

  return sequelize.transaction(async (transaction) => {
    player.team_id = toTeam.id;
    await playerRepository.save(player, { transaction });

    await transferRepository.createTransfer(
      {
        player_id: player.id,
        from_team_id: fromTeamId,
        to_team_id: toTeam.id,
        price: player.price,
        created_by_admin_id: adminId
      },
      { transaction }
    );

    return {
      player,
      fromTeamId,
      toTeam
    };
  });
}

module.exports = {
  assignPlayerToTeam
};

