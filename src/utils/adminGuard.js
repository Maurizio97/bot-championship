const adminService = require('../services/adminService');

async function ensureAdminByMessage(message) {
  return adminService.ensureAdmin(message.author.username);
}

module.exports = {
  ensureAdminByMessage
};

