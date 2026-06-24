const { BadRequestError } = require('../utils/errors');

const DEFAULT_PLAYER_AGE = 24;

function getAgeGrowth(age) {
  if (age <= 18) return 8;
  if (age <= 20) return 7;
  if (age <= 22) return 6;
  if (age <= 25) return 5;
  if (age <= 28) return 4;
  if (age <= 30) return 3;
  if (age === 31) return 0;
  if (age === 32) return -1;
  if (age === 33) return -2;
  return -3;
}

function getOverallPositiveCap(overall) {
  if (overall >= 91) {
    return 1;
  }

  if (overall >= 90) {
    return 2;
  }

  if (overall >= 87) {
    return 2;
  }

  if (overall >= 85) {
    return 3;
  }

  if (overall >= 83) return 4;
  if (overall >= 80) return 5;
  if (overall >= 75) return 6;
  if (overall >= 70) return 6;
  if (overall >= 65) return 7;
  if (overall >= 60) return 7;
  return 7;
}

function getPerformanceBonus({ goals, assists }) {
  const safeGoals = Number(goals) || 0;
  const safeAssists = Number(assists) || 0;

  let bonus = Math.floor(safeGoals / 10) + Math.floor(safeAssists / 8);
  if (safeGoals + safeAssists >= 25) {
    bonus += 1;
  }

  return Math.max(0, Math.min(4, bonus));
}

function normalizeStat(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestError(`${fieldName} deve essere numerico e >= 0.`);
  }

  return Math.floor(parsed);
}

function calculateSeasonGrowth({ oldOverall, oldAge, goals, assists }) {
  if (!Number.isInteger(oldOverall) || oldOverall < 1 || oldOverall > 99) {
    throw new BadRequestError('Overall giocatore non valido.');
  }

  const normalizedGoals = normalizeStat(goals, 'goals');
  const normalizedAssists = normalizeStat(assists, 'assists');

  const baseAge = Number.isInteger(oldAge) && oldAge >= 0 ? oldAge : DEFAULT_PLAYER_AGE;
  const newAge = baseAge + 1;
  const ageGrowth = getAgeGrowth(newAge);
  const performanceBonus = getPerformanceBonus({ goals: normalizedGoals, assists: normalizedAssists });

  const rawGrowth = ageGrowth + performanceBonus;
  const positiveCap = getOverallPositiveCap(oldOverall);
  const appliedGrowth = rawGrowth > 0 ? Math.min(rawGrowth, positiveCap) : rawGrowth;

  const newOverall = Math.max(1, Math.min(99, oldOverall + appliedGrowth));
  const growthApplied = newOverall - oldOverall;

  return {
    oldAge: baseAge,
    newAge,
    oldOverall,
    newOverall,
    goals: normalizedGoals,
    assists: normalizedAssists,
    ageGrowth,
    performanceBonus,
    growthApplied
  };
}

module.exports = {
  DEFAULT_PLAYER_AGE,
  calculateSeasonGrowth,
  getAgeGrowth,
  getOverallPositiveCap,
  getPerformanceBonus
};

