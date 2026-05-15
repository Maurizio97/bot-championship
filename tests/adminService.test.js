const test = require('node:test');
const assert = require('node:assert/strict');

const adminRepository = require('../src/repositories/adminRepository');
const adminService = require('../src/services/adminService');

test('addAdmin rifiuta duplicati', async () => {
  const originalFindByDiscordId = adminRepository.findByDiscordId;

  adminRepository.findByDiscordId = async () => ({ id: 1, discord_id: '12345678901234567' });

  try {
    await assert.rejects(
      () => adminService.addAdmin({ discordId: '12345678901234567', role: 'admin' }),
      (error) => {
        assert.match(error.message, /gia admin/i);
        return true;
      }
    );
  } finally {
    adminRepository.findByDiscordId = originalFindByDiscordId;
  }
});

test('removeAdmin blocca rimozione ultimo superadmin', async () => {
  const originalFindByDiscordId = adminRepository.findByDiscordId;
  const originalCountByRole = adminRepository.countByRole;

  adminRepository.findByDiscordId = async () => ({ id: 1, discord_id: 'owner', role: 'superadmin' });
  adminRepository.countByRole = async () => 1;

  try {
    await assert.rejects(
      () => adminService.removeAdmin({ discordId: 'owner' }),
      (error) => {
        assert.match(error.message, /ultimo superadmin/i);
        return true;
      }
    );
  } finally {
    adminRepository.findByDiscordId = originalFindByDiscordId;
    adminRepository.countByRole = originalCountByRole;
  }
});

