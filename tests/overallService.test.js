const test = require('node:test');
const assert = require('node:assert/strict');

const { Player, OverallHistory } = require('../src/models');
const overallService = require('../src/services/overallService');

test('getPlayerOverallSummary calcola iniziale, attuale, delta e valore', async () => {
  const originalFindByPk = Player.findByPk;
  const originalHistoryFindAll = OverallHistory.findAll;

  Player.findByPk = async () => ({ id: 7, player_name: 'Test Player', overall: 86, price: 68 });
  OverallHistory.findAll = async () => ([
    { id: 1, old_overall: 80, new_overall: 82 },
    { id: 2, old_overall: 82, new_overall: 86 }
  ]);

  try {
    const summary = await overallService.getPlayerOverallSummary(7);

    assert.equal(summary.initialOverall, 80);
    assert.equal(summary.currentOverall, 86);
    assert.equal(summary.overallDelta, 6);
    assert.equal(summary.currentValue, 68);
    assert.equal(summary.totalChanges, 2);
  } finally {
    Player.findByPk = originalFindByPk;
    OverallHistory.findAll = originalHistoryFindAll;
  }
});

test('getPlayerOverallSummary usa overall attuale come iniziale quando non c e storico', async () => {
  const originalFindByPk = Player.findByPk;
  const originalHistoryFindAll = OverallHistory.findAll;

  Player.findByPk = async () => ({ id: 11, player_name: 'No History', overall: 79, price: 17 });
  OverallHistory.findAll = async () => ([]);

  try {
    const summary = await overallService.getPlayerOverallSummary(11);

    assert.equal(summary.initialOverall, 79);
    assert.equal(summary.currentOverall, 79);
    assert.equal(summary.overallDelta, 0);
    assert.equal(summary.totalChanges, 0);
  } finally {
    Player.findByPk = originalFindByPk;
    OverallHistory.findAll = originalHistoryFindAll;
  }
});

