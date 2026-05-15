const adminMiddleware = require('../middlewares/adminMiddleware');

async function ensureAdminByMessage(message) {
  return adminMiddleware(message);
}

module.exports = {
  ensureAdminByMessage
};

