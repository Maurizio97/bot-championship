function getDiscordIdentityCandidates(messageAuthor) {
  return [messageAuthor?.id, messageAuthor?.username]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function formatDiscordIdentity(discordId) {
  const normalized = String(discordId || '').trim();

  if (/^\d{17,20}$/.test(normalized)) {
    return `<@${normalized}>`;
  }

  return normalized ? `@${normalized}` : 'N/A';
}

function formatTeamLabel(team) {
  if (!team) {
    return 'N/A';
  }

  return `${team.name} (${formatDiscordIdentity(team.owner_discord_id)})`;
}

module.exports = {
  getDiscordIdentityCandidates,
  formatDiscordIdentity,
  formatTeamLabel
};

