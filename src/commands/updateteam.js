const teamService = require('../services/teamService');
const { ensureAdminByMessage } = require('../utils/adminGuard');
const { successEmbed } = require('../utils/embedFactory');
const { formatTeamLabel } = require('../utils/discordIdentity');
const { assertDiscordTag, assertPositiveInteger } = require('../utils/validators');

module.exports = {
  name: 'updateteam',
  description: 'Modifica nome squadra e utente assegnato',
  usage: '&updateteam <teamId> <nuovoNomeSquadra> <@owner>',
  async execute(message, args) {
    await ensureAdminByMessage(message);

    if (args.length < 3) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const teamId = assertPositiveInteger(args[0], 'teamId');
    const rawOwnerDiscordId = args[args.length - 1];
    const ownerDiscordId = assertDiscordTag(rawOwnerDiscordId, 'ownerTag');
    const newName = args.slice(1, -1).join(' ').trim();

    if (!newName) {
      throw new Error(`Uso corretto: ${this.usage}`);
    }

    const updated = await teamService.updateTeamDetails({
      teamId,
      newName,
      ownerDiscordId
    });

    const embed = successEmbed('Squadra aggiornata', 'Dati squadra aggiornati con successo.', [
      { name: 'Team ID', value: String(updated.id), inline: true },
      { name: 'Squadra', value: formatTeamLabel(updated), inline: true }
    ]);

    await message.reply({ embeds: [embed] });
  }
};

