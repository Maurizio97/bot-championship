const { EmbedBuilder } = require('discord.js');

function successEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp(new Date());

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp(new Date());
}

module.exports = {
  successEmbed,
  errorEmbed
};

