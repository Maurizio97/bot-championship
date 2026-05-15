const addteam = require('./addteam');
const assignplayer = require('./assignplayer');
const comandi = require('./comandi');
const updateteam = require('./updateteam');
const rose = require('./rose');

const commands = new Map();

for (const command of [addteam, assignplayer, comandi, updateteam, rose]) {
  commands.set(command.name, command);
}

module.exports = commands;

