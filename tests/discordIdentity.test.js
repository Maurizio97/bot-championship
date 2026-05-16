const test = require('node:test');
const assert = require('node:assert/strict');

const { formatDiscordIdentity, formatTeamLabel } = require('../src/utils/discordIdentity');

test('formatDiscordIdentity formatta snowflake come mention', () => {
  assert.equal(formatDiscordIdentity('12345678901234567'), '<@12345678901234567>');
});

test('formatDiscordIdentity formatta username legacy', () => {
  assert.equal(formatDiscordIdentity('encke_'), '@encke_');
});

test('formatTeamLabel include nome squadra e owner tag', () => {
  assert.equal(
    formatTeamLabel({ name: 'Bulls', owner_discord_id: '12345678901234567' }),
    'Bulls (<@12345678901234567>)'
  );
});

