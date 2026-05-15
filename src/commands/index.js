const addteam = require('./addteam');
const addadmin = require('./addadmin');
const admins = require('./admins');
const removeadmin = require('./removeadmin');
const assignplayer = require('./assignplayer');
const aggiungi = require('./aggiungi');
const budget = require('./budget');
const chi = require('./chi');
const chiudidraft = require('./chiudidraft');
const chiudimercato = require('./chiudimercato');
const closeteams = require('./closeteams');
const comandi = require('./comandi');
const continua = require('./continua');
const continueteams = require('./continueteams');
const iniziodraft = require('./iniziodraft');
const ordine = require('./ordine');
const rosa = require('./rosa');
const togli = require('./togli');
const turno = require('./turno');
const updateteam = require('./updateteam');
const valore = require('./valore');
const aprimercato = require('./aprimercato');

const commands = new Map();

for (const command of [
  addteam,
  addadmin,
  admins,
  removeadmin,
  assignplayer,
  aggiungi,
  budget,
  chi,
  chiudidraft,
  chiudimercato,
  closeteams,
  comandi,
  continua,
  continueteams,
  iniziodraft,
  ordine,
  rosa,
  togli,
  turno,
  updateteam,
  valore,
  aprimercato
]) {
  commands.set(command.name, command);
}

module.exports = commands;

