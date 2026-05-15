const { DraftOrder, Team } = require('../models');

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
  findByType
};

