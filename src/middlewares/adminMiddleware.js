const adminService = require('../services/adminService');

async function adminMiddleware(message) {
  const candidates = [message.author.id, message.author.username]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const admin = await adminService.getAdminByDiscordId(candidate);
    if (admin) {
      return admin;
    }
  }

  return adminService.ensureAdmin(message.author.id || message.author.username);
}

module.exports = adminMiddleware;


