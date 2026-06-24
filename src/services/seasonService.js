const { sequelize } = require('../models');
const leagueStateRepository = require('../repositories/leagueStateRepository');
const overallHistoryRepository = require('../repositories/overallHistoryRepository');
const playerRepository = require('../repositories/playerRepository');
const { calculateSeasonGrowth } = require('./playerGrowthService');
const { calculatePlayerValue } = require('./playerValueService');
const { normalizeSearchText } = require('../utils/textSearch');
const { BadRequestError, ConflictError } = require('../utils/errors');

function parseNonNegativeInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

function buildPlayersByNormalizedName(players) {
  const lookup = new Map();

  for (const player of players) {
    const key = normalizeSearchText(player.player_name);
    if (!key) {
      continue;
    }

    if (!lookup.has(key)) {
      lookup.set(key, []);
    }

    lookup.get(key).push(player);
  }

  return lookup;
}

function pushRowIssue(target, { lineNumber, reason, playerId = null, playerName = null }) {
  target.push({
    lineNumber,
    reason,
    playerId,
    playerName
  });
}

async function resolveRowsToPlayerStats(rows, transaction) {
  const playerIdsFromCsv = rows
    .map((row) => String(row.player_id || '').trim())
    .filter((value) => value.length > 0)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const playersById = new Map();
  const playersByName = buildPlayersByNormalizedName(await playerRepository.findAll({ transaction }));

  if (playerIdsFromCsv.length > 0) {
    const players = await playerRepository.findByIds(playerIdsFromCsv, { transaction });
    players.forEach((player) => {
      playersById.set(player.id, player);
    });
  }

  const aggregatedByPlayerId = new Map();
  const invalidRows = [];
  const notFoundRows = [];
  const ambiguousRows = [];

  for (const row of rows) {
    const goals = parseNonNegativeInteger(row.goals);
    const assists = parseNonNegativeInteger(row.assists);

    if (goals === null || assists === null) {
      pushRowIssue(invalidRows, {
        lineNumber: row.lineNumber,
        reason: 'goals/assists non validi (devono essere numerici e >= 0)',
        playerId: row.player_id || null,
        playerName: row.player_name || null
      });
      continue;
    }

    let resolvedPlayer = null;
    const rawPlayerId = String(row.player_id || '').trim();
    const rawPlayerName = String(row.player_name || '').trim();

    if (rawPlayerId) {
      const parsedPlayerId = Number(rawPlayerId);
      if (!Number.isInteger(parsedPlayerId) || parsedPlayerId <= 0) {
        pushRowIssue(invalidRows, {
          lineNumber: row.lineNumber,
          reason: 'player_id non valido',
          playerId: rawPlayerId,
          playerName: rawPlayerName || null
        });
        continue;
      }

      resolvedPlayer = playersById.get(parsedPlayerId) || null;
      if (!resolvedPlayer) {
        pushRowIssue(notFoundRows, {
          lineNumber: row.lineNumber,
          reason: 'player_id non trovato',
          playerId: parsedPlayerId,
          playerName: rawPlayerName || null
        });
        continue;
      }
    } else {
      const normalizedName = normalizeSearchText(rawPlayerName);
      if (!normalizedName) {
        pushRowIssue(invalidRows, {
          lineNumber: row.lineNumber,
          reason: 'player_name mancante o non valido',
          playerName: rawPlayerName || null
        });
        continue;
      }

      const matchedPlayers = playersByName.get(normalizedName) || [];
      if (matchedPlayers.length === 0) {
        pushRowIssue(notFoundRows, {
          lineNumber: row.lineNumber,
          reason: 'player_name non trovato',
          playerName: rawPlayerName
        });
        continue;
      }

      if (matchedPlayers.length > 1) {
        pushRowIssue(ambiguousRows, {
          lineNumber: row.lineNumber,
          reason: 'player_name ambiguo',
          playerName: rawPlayerName
        });
        continue;
      }

      [resolvedPlayer] = matchedPlayers;
    }

    const existing = aggregatedByPlayerId.get(resolvedPlayer.id) || {
      playerId: resolvedPlayer.id,
      playerName: resolvedPlayer.player_name,
      goals: 0,
      assists: 0,
      rows: []
    };

    existing.goals += goals;
    existing.assists += assists;
    existing.rows.push(row.lineNumber);

    aggregatedByPlayerId.set(resolvedPlayer.id, existing);
  }

  return {
    aggregatedByPlayerId,
    invalidRows,
    notFoundRows,
    ambiguousRows
  };
}

async function createNewSeasonFromRows({ rows, reason = 'SEASON_UPDATE', adminDiscordId = null }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BadRequestError('Nessuna riga CSV da elaborare.');
  }

  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    const previousSeason = Number(state.current_season_number || 1);
    const nextSeason = previousSeason + 1;

    const existingRowsForNextSeason = await overallHistoryRepository.countBySeasonNumber(nextSeason, { transaction });
    if (existingRowsForNextSeason > 0) {
      throw new ConflictError(`Esistono gia dati storici per la stagione ${nextSeason}. Operazione bloccata.`);
    }

    const resolved = await resolveRowsToPlayerStats(rows, transaction);
    const statsByPlayerId = resolved.aggregatedByPlayerId;
    const allPlayers = await playerRepository.findAll({ transaction });

    if (allPlayers.length === 0) {
      throw new BadRequestError('Nessun giocatore presente in archivio: stagione non creata.');
    }

    let updatedPlayers = 0;
    let increasedPlayers = 0;
    let decreasedPlayers = 0;
    let unchangedPlayers = 0;

    for (const basePlayer of allPlayers) {
      const player = await playerRepository.findByIdForUpdate(basePlayer.id, transaction);
      if (!player) {
        continue;
      }

      const statRow = statsByPlayerId.get(player.id) || {
        goals: 0,
        assists: 0
      };

      const growthResult = calculateSeasonGrowth({
        oldOverall: Number(player.overall),
        oldAge: Number.isInteger(player.age) ? player.age : null,
        goals: statRow.goals,
        assists: statRow.assists
      });

      const oldPrice = Number(player.price);
      const newPrice = calculatePlayerValue({
        overall: growthResult.newOverall,
        age: growthResult.newAge,
        role: player.role
      });

      await overallHistoryRepository.createEntry(
        {
          player_id: player.id,
          season_number: nextSeason,
          old_overall: growthResult.oldOverall,
          new_overall: growthResult.newOverall,
          old_age: growthResult.oldAge,
          new_age: growthResult.newAge,
          old_price: oldPrice,
          new_price: newPrice,
          goals: growthResult.goals,
          assists: growthResult.assists,
          growth_applied: growthResult.growthApplied,
          reason,
          updated_by_admin_id: null
        },
        { transaction }
      );

      player.overall = growthResult.newOverall;
      player.age = growthResult.newAge;
      player.price = newPrice;
      await playerRepository.save(player, { transaction });

      updatedPlayers += 1;
      if (growthResult.growthApplied > 0) {
        increasedPlayers += 1;
      } else if (growthResult.growthApplied < 0) {
        decreasedPlayers += 1;
      } else {
        unchangedPlayers += 1;
      }
    }

    state.current_season_number = nextSeason;
    await state.save({ transaction });

    return {
      previousSeason,
      newSeason: nextSeason,
      updatedPlayers,
      increasedPlayers,
      decreasedPlayers,
      unchangedPlayers,
      notFoundRows: resolved.notFoundRows,
      invalidRows: resolved.invalidRows,
      ambiguousRows: resolved.ambiguousRows,
      adminDiscordId
    };
  });
}

async function rollbackCurrentSeason() {
  return sequelize.transaction(async (transaction) => {
    const state = await leagueStateRepository.getForUpdate(transaction);
    const currentSeason = Number(state.current_season_number || 1);

    if (currentSeason <= 1) {
      throw new ConflictError('Rollback non consentito: la stagione corrente e gia la 1.');
    }

    const historyRows = await overallHistoryRepository.findBySeasonNumber(currentSeason, { transaction });
    if (historyRows.length === 0) {
      throw new ConflictError(`Nessuno storico trovato per la stagione ${currentSeason}.`);
    }

    const restoreRowsByPlayer = new Map();
    for (const historyRow of historyRows) {
      if (!restoreRowsByPlayer.has(historyRow.player_id)) {
        restoreRowsByPlayer.set(historyRow.player_id, historyRow);
      }
    }

    let restoredPlayers = 0;

    for (const [playerId, historyRow] of restoreRowsByPlayer.entries()) {
      const player = await playerRepository.findByIdForUpdate(playerId, transaction);
      if (!player) {
        continue;
      }

      player.overall = historyRow.old_overall;
      if (historyRow.old_age !== null && historyRow.old_age !== undefined) {
        player.age = historyRow.old_age;
      }
      if (historyRow.old_price !== null && historyRow.old_price !== undefined) {
        player.price = historyRow.old_price;
      }

      await playerRepository.save(player, { transaction });
      restoredPlayers += 1;
    }

    const deletedHistoryRows = await overallHistoryRepository.deleteBySeasonNumber(currentSeason, { transaction });

    state.current_season_number = currentSeason - 1;
    await state.save({ transaction });

    return {
      rolledBackSeason: currentSeason,
      currentSeason: currentSeason - 1,
      restoredPlayers,
      deletedHistoryRows
    };
  });
}

module.exports = {
  createNewSeasonFromRows,
  rollbackCurrentSeason
};


