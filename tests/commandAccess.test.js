const test = require('node:test');
const assert = require('node:assert/strict');

const ordine = require('../src/commands/ordine');
const turno = require('../src/commands/turno');
const budget = require('../src/commands/budget');
const chi = require('../src/commands/chi');
const rosa = require('../src/commands/rosa');
const valore = require('../src/commands/valore');
const comandi = require('../src/commands/comandi');
const scegli = require('../src/commands/scegli');
const assegna = require('../src/commands/assegna');

const publicCommands = [
  ordine,
  turno,
  budget,
  chi,
  rosa,
  valore,
  comandi,
  scegli
];

test('i comandi informativi restano accessibili agli utenti normali', () => {
  for (const command of publicCommands) {
    assert.equal(
      command.adminOnly,
      false,
      `Il comando ${command.name} deve avere adminOnly=false`
    );
  }
});

test('il comando assegna resta riservato allo staff', () => {
  assert.equal(assegna.adminOnly, true);
});

