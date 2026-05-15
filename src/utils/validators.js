const { BadRequestError } = require('./errors');

function assertDiscordId(value, fieldName = 'discordId') {
  if (!value || !/^\d{6,30}$/.test(value)) {
    throw new BadRequestError(`${fieldName} non valido.`);
  }
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

