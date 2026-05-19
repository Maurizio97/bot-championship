const { DraftOrder, Team } = require('../models');

/**
 * Riordina le voci PLAYER_DRAFT in base al budget attuale delle squadre (DESC).
 * In caso di parità mantiene l'ordine di posizione precedente.
 * Eseguito all'inizio di ogni nuovo round, dentro la transazione del pick.
 */
async function reorderPlayerDraftByBudget(transaction) {
  const entries = await DraftOrder.findAll({
    where: { type: 'PLAYER_DRAFT' },
    include: [{ model: Team, as: 'team', required: true }],
    order: [['position', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (entries.length === 0) return;

  const sorted = [...entries].sort((a, b) => {
    const budgetDiff = Number(b.team.budget) - Number(a.team.budget);
    if (budgetDiff !== 0) return budgetDiff;
    return a.position - b.position; // pareggio: mantieni ordine precedente
  });

  await DraftOrder.destroy({ where: { type: 'PLAYER_DRAFT' }, transaction });
  await DraftOrder.bulkCreate(
    sorted.map((entry, index) => ({
      type: 'PLAYER_DRAFT',
      discord_user_id: entry.discord_user_id,
      team_id: entry.team_id,
      position: index
    })),
    { transaction }
  );
}

async function deleteByType(type, options = {}) {
  return DraftOrder.destroy({
    where: { type },
    ...options
  });
}

async function bulkCreate(rows, options = {}) {
  return DraftOrder.bulkCreate(rows, options);
}

async function findByType(type, options = {}) {
  return DraftOrder.findAll({
    where: { type },
    include: [
      {
        model: Team,
        as: 'team',
        required: false
      }
    ],
    order: [['position', 'ASC']],
    ...options
  });
}

module.exports = {
  deleteByType,
  bulkCreate,
  findByType,
  reorderPlayerDraftByBudget
};

