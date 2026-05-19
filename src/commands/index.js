const env = require('../config/env');
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
const comandi = require('./comandi');
const comandistaff = require('./comandistaff');
const continua = require('./continua');
const iniziodraft = require('./iniziodraft');
const ordine = require('./ordine');
const pausadraft = require('./pausadraft');
const rosa = require('./rosa');
const scegli = require('./scegli');
const assegna = require('./assegna');
const teams = require('./teams');
const togli = require('./togli');
const turno = require('./turno');
const updateteam = require('./updateteam');
const valore = require('./valore');
const aprimercato = require('./aprimercato');
const saltaturno = require('./saltaturno');

const commands = new Map();

function normalizeUsage(usage) {
  const prefix = env.prefix || '!';
  if (typeof usage !== 'string' || !usage) {
    return usage;
  }

  // Se non inizia già con il prefix, aggiungilo
  if (!usage.startsWith(prefix)) {
    return `${prefix}${usage}`;
  }

  return usage;
}

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
  comandi,
  comandistaff,
  continua,
  iniziodraft,
  ordine,
  pausadraft,
  rosa,
  scegli,
  assegna,
  teams,
  togli,
  turno,
  updateteam,
  valore,
  aprimercato,
  saltaturno
]) {
  command.usage = normalizeUsage(command.usage);
  commands.set(command.name, command);
}

module.exports = commands;

