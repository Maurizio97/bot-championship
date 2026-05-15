const { BadRequestError } = require('./errors');

function assertDiscordId(value, fieldName = 'discordId') {
  const raw = String(value || '').trim();
  const mentionMatch = raw.match(/^<@!?(\d{17,20})>$/);
  const normalized = mentionMatch ? mentionMatch[1] : raw;

  const isSnowflake = /^\d{17,20}$/.test(normalized);
  const isLegacyUsername = /^[a-z0-9._]{2,64}$/i.test(normalized);

  if (!isSnowflake && !isLegacyUsername) {
    throw new BadRequestError(`${fieldName} non valido. Usa Discord ID numerico o username valido.`);
  }

  return normalized;
}

function assertDiscordTag(value, fieldName = 'discordTag') {
  const raw = String(value || '').trim();
  const mentionMatch = raw.match(/^<@!?(\d{17,20})>$/);

  if (!mentionMatch) {
    throw new BadRequestError(`${fieldName} non valido. Usa sempre la mention Discord (es. @utente).`);
  }

  return mentionMatch[1];
}

function assertPositiveInteger(value, fieldName = 'id') {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${fieldName} deve essere un intero positivo.`);
  }

  return parsed;
}

function assertPositiveAmount(value, fieldName = 'amount') {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${fieldName} deve essere un intero positivo.`);
  }

  return parsed;
}

module.exports = {
  assertDiscordId,
  assertDiscordTag,
  assertPositiveInteger,
  assertPositiveAmount
};

