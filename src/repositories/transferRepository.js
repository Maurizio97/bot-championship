const { Op } = require('sequelize');
const { Transfer } = require('../models');

async function createTransfer(data, options = {}) {
  return Transfer.create(data, options);
}

async function deleteByTeamId(teamId, options = {}) {
  return Transfer.destroy({
    where: {
      [Op.or]: [
        { from_team_id: teamId },
        { to_team_id: teamId }
      ]
    },
    ...options
  });
}

module.exports = {
  createTransfer,
  deleteByTeamId
};
