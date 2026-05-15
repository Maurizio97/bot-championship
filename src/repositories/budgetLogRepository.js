const { BudgetLog } = require('../models');

async function createLog(data, options = {}) {
  return BudgetLog.create(data, options);
}

module.exports = {
  createLog
};

