const adminRepository = require('../repositories/adminRepository');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

const ALLOWED_ROLES = new Set(['admin', 'superadmin']);

async function getAdminByDiscordId(discordKey) {
  return adminRepository.findByDiscordId(discordKey);
}

async function ensureAdmin(discordKey) {
  const admin = await getAdminByDiscordId(discordKey);

  if (!admin) {
    throw new ForbiddenError('Non hai i permessi admin per usare questo comando.');
  }

  return admin;
}

async function listAdmins() {
  return adminRepository.findAll();
}

async function addAdmin({ discordId, role }) {
  const normalizedDiscordId = String(discordId || '').trim();
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (!normalizedDiscordId) {
    throw new BadRequestError('discordId obbligatorio.');
  }

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    throw new BadRequestError('role non valido. Usa admin o superadmin.');
  }

  const existing = await adminRepository.findByDiscordId(normalizedDiscordId);
  if (existing) {
    throw new ConflictError(`L'utente ${normalizedDiscordId} e gia admin.`);
  }

  return adminRepository.createAdmin({
    discord_id: normalizedDiscordId,
    role: normalizedRole
  });
}

async function removeAdmin({ discordId }) {
  const normalizedDiscordId = String(discordId || '').trim();
  if (!normalizedDiscordId) {
    throw new BadRequestError('discordId obbligatorio.');
  }

  const existing = await adminRepository.findByDiscordId(normalizedDiscordId);
  if (!existing) {
    throw new NotFoundError(`Admin ${normalizedDiscordId} non trovato.`);
  }

  if (existing.role === 'superadmin') {
    const superadminCount = await adminRepository.countByRole('superadmin');
    if (superadminCount <= 1) {
      throw new ForbiddenError('Impossibile rimuovere l\'ultimo superadmin.');
    }
  }

  await adminRepository.destroyById(existing.id);
  return existing;
}

module.exports = {
  getAdminByDiscordId,
  ensureAdmin,
  listAdmins,
  addAdmin,
  removeAdmin
};

