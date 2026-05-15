const addteam = require('./addteam');
const assignplayer = require('./assignplayer');

const commands = new Map();

for (const command of [addteam, assignplayer]) {
  commands.set(command.name, command);
}

module.exports = commands;

