const { Transfer } = require('../models');

async function createTransfer(data, options = {}) {
  return Transfer.create(data, options);
}

module.exports = {
  createTransfer
};

