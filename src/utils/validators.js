const { BadRequestError } = require('./errors');

function assertDiscordId(value, fieldName = 'discordId') {
  const normalized = String(value || '').trim();

  // Username Discord: stringa breve con lettere/numeri e caratteri . _
  if (!/^[a-z0-9._]{2,64}$/i.test(normalized)) {
    throw new BadRequestError(`${fieldName} non valido. Usa username Discord (es. encke_).`);
  }

  return normalized;
}

function assertPositiveInteger(value, fieldName = 'id') {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${fieldName} deve essere un intero positivo.`);
  }

  return parsed;
}

module.exports = {
  assertDiscordId,
  assertPositiveInteger
};

