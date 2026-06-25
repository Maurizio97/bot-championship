const { BadRequestError } = require('../utils/errors');

const OVERALL_BASE_VALUE = {
  72: 3,
  73: 4,
  74: 5,
  75: 7,
  76: 9,
  77: 11,
  78: 14,
  79: 17,
  80: 21,
  81: 26,
  82: 32,
  83: 39,
  84: 47,
  85: 56,
  86: 68,
  87: 82,
  88: 98,
  89: 118,
  90: 140,
  91: 165,
  92: 195,
  93: 230,
  94: 270
};

const ROLE_MULTIPLIERS = {
  POR: 0.85,
  GK: 0.85,
  DC: 0.95,
  CB: 0.95,
  TD: 0.9,
  TS: 0.9,
  ADA: 0.9,
  ASA: 0.9,
  RB: 0.9,
  LB: 0.9,
  RWB: 0.9,
  LWB: 0.9,
  CDC: 1,
  CDM: 1,
  CC: 1,
  CM: 1,
  COC: 1.1,
  CAM: 1.1,
  ED: 1.15,
  ES: 1.15,
  AD: 1.15,
  AS: 1.15,
  RW: 1.15,
  LW: 1.15,
  RM: 1.15,
  LM: 1.15,
  AT: 1.2,
  ATT: 1.2,
  ST: 1.2,
  CF: 1.2
};

function getOverallBaseValue(overall) {
  if (!Number.isInteger(overall) || overall < 1 || overall > 99) {
    throw new BadRequestError('overall non valido per il ricalcolo valore.');
  }

  if (overall >= 95) {
    return 315;
  }

  if (overall <= 72) {
    return 3;
  }

  return OVERALL_BASE_VALUE[overall];
}

function getAgeMultiplier(age) {
  if (!Number.isInteger(age) || age < 0) {
    throw new BadRequestError('age non valida per il ricalcolo valore.');
  }

  if (age <= 20) return 1.35;
  if (age <= 23) return 1.25;
  if (age <= 26) return 1.15;
  if (age <= 29) return 1;
  if (age <= 31) return 0.85;
  if (age <= 33) return 0.7;
  if (age <= 35) return 0.55;
  return 0.4;
}

function normalizeRoleTokens(role) {
  return String(role || '')
    .toUpperCase()
    .replace(/\./g, ' ')
    .replace(/[-_]/g, ' ')
    .split(/[\s/]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getRoleMultiplier(role) {
  const tokens = normalizeRoleTokens(role);
  if (tokens.length === 0) {
    return 1;
  }

  let maxMultiplier = null;

  for (const token of tokens) {
    const multiplier = ROLE_MULTIPLIERS[token];
    if (typeof multiplier === 'number') {
      if (maxMultiplier === null) {
        maxMultiplier = multiplier;
      } else {
        maxMultiplier = Math.max(maxMultiplier, multiplier);
      }
    }
  }

  return maxMultiplier === null ? 1 : maxMultiplier;
}

function calculatePlayerValue({ overall, age, role }) {
  const baseValue = getOverallBaseValue(overall);
  const ageMultiplier = getAgeMultiplier(age);
  const roleMultiplier = getRoleMultiplier(role);

  return Math.max(1, Math.round(baseValue * ageMultiplier * roleMultiplier));
}

function calculateReleaseClause(playerValue) {
  const normalizedValue = Number(playerValue);
  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    throw new BadRequestError('valore non valido per il calcolo clausola.');
  }

  return Math.round(normalizedValue * 1.25);
}

// function calculateReleaseClause(playerValue) {
//   const normalizedValue = Number(playerValue);
//   if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
//     throw new BadRequestError('valore non valido per il calcolo clausola.');
//   }
//
//   if (normalizedValue <= 20) {
//     return Math.round(normalizedValue * 2.5);
//   }
//
//   if (normalizedValue <= 50) {
//     return Math.round(normalizedValue * 2.3);
//   }
//
//   if (normalizedValue <= 100) {
//     return Math.round(normalizedValue * 2.2);
//   }
//
//   return Math.round(normalizedValue * 2.0);
// }

module.exports = {
  calculatePlayerValue,
  calculateReleaseClause,
  getAgeMultiplier,
  getRoleMultiplier,
  getOverallBaseValue
};
