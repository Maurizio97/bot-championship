const { sequelize } = require('../models');
const { Player, OverallHistory } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function updatePlayerOverall({ playerId, newOverall, reason, adminId }) {
  if (!Number.isInteger(playerId) || !Number.isInteger(newOverall)) {
    throw new BadRequestError('playerId e newOverall devono essere interi.');
  }

  if (newOverall < 1 || newOverall > 99) {
    throw new BadRequestError('newOverall deve essere compreso tra 1 e 99.');
  }

  return sequelize.transaction(async (transaction) => {
    const player = await Player.findByPk(playerId, { transaction });
    if (!player) {
      throw new NotFoundError(`Giocatore con ID ${playerId} non trovato.`);
    }

    const oldOverall = player.overall;
    player.overall = newOverall;
    await player.save({ transaction });

    await OverallHistory.create(
      {
        player_id: player.id,
        old_overall: oldOverall,
        new_overall: newOverall,
        reason,
        updated_by_admin_id: adminId
      },
      { transaction }
    );

    return player;
  });
}

async function getPlayerOverallSummary(playerId) {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new BadRequestError('playerId deve essere un intero positivo.');
  }

  const player = await Player.findByPk(playerId);
  if (!player) {
    throw new NotFoundError(`Giocatore con ID ${playerId} non trovato.`);
  }

  const historyRows = await OverallHistory.findAll({
    where: { player_id: player.id },
    order: [['id', 'ASC']]
  });

  const initialOverall = historyRows.length > 0 ? Number(historyRows[0].old_overall) : Number(player.overall);
  const currentOverall = Number(player.overall);

  return {
    player,
    totalChanges: historyRows.length,
    initialOverall,
    currentOverall,
    overallDelta: currentOverall - initialOverall,
    currentValue: Number(player.price)
  };
}

module.exports = {
  updatePlayerOverall,
  getPlayerOverallSummary
};

