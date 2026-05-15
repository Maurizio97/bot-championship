const draftService = require('../services/draftService');
const { ForbiddenError } = require('../utils/errors');

async function correctTurnMiddleware(discordUserId, discordUserCandidates = []) {
  const { currentEntry } = await draftService.getCurrentTurnInfo();

  const candidates = [discordUserId, ...discordUserCandidates]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (!currentEntry || !candidates.includes(currentEntry.discord_user_id)) {
    throw new ForbiddenError('Non e il tuo turno.');
  }

  return currentEntry;
}

module.exports = correctTurnMiddleware;


