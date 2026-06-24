const { OverallHistory } = require('../models');

async function createEntry(payload, options = {}) {
  return OverallHistory.create(payload, options);
}

async function findBySeasonNumber(seasonNumber, options = {}) {
  return OverallHistory.findAll({
    where: { season_number: seasonNumber },
    order: [['id', 'ASC']],
    ...options
  });
}

async function countBySeasonNumber(seasonNumber, options = {}) {
  return OverallHistory.count({
    where: { season_number: seasonNumber },
    ...options
  });
}

async function deleteBySeasonNumber(seasonNumber, options = {}) {
  return OverallHistory.destroy({
    where: { season_number: seasonNumber },
    ...options
  });
}

module.exports = {
  createEntry,
  findBySeasonNumber,
  countBySeasonNumber,
  deleteBySeasonNumber
};

