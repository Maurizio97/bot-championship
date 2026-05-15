function computeNextDraftState({ currentTurn, currentRound, orderLength }) {
  const safeOrderLength = Number(orderLength || 0);

  if (safeOrderLength <= 0) {
    return {
      nextTurn: 0,
      nextRound: currentRound
    };
  }

  let nextTurn = currentTurn + 1;
  let nextRound = currentRound;

  if (nextTurn >= safeOrderLength) {
    nextTurn = 0;
    nextRound += 1;
  }

  return {
    nextTurn,
    nextRound
  };
}

module.exports = {
  computeNextDraftState
};

