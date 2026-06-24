const test = require('node:test');
const assert = require('node:assert/strict');

const { parseCsvText } = require('../src/services/csvPlayerStatsImporter');

test('parseCsvText legge righe CSV valide con player_id', () => {
  const rows = parseCsvText('player_id,player_name,goals,assists\n1,Rossi,10,4\n2,Bianchi,0,1');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].player_id, '1');
  assert.equal(rows[1].assists, '1');
});

test('parseCsvText richiede colonne goals e assists', () => {
  assert.throws(
    () => parseCsvText('player_id,player_name\n1,Rossi'),
    /goals e assists/i
  );
});

