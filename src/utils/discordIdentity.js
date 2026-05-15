function getDiscordIdentityCandidates(messageAuthor) {
  return [messageAuthor?.id, messageAuthor?.username]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

module.exports = {
  getDiscordIdentityCandidates
};

