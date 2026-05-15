const adminService = require('../services/adminService');

async function ensureAdminByMessage(message) {
  return adminService.ensureAdmin(message.author.id);
}

module.exports = {
  ensureAdminByMessage
};

