export function createGameState() {
  return {
    gold: 0,
    autoIncome: 10, // per period
    // Faster early-game tempo
    incomePeriodMs: 3000,
    // used for offline earnings
    lastSeenMs: Date.now(),
  };
}

export function addGold(state, amount) {
  state.gold = Math.max(0, Math.floor(state.gold + amount));
}

export function setGold(state, amount) {
  state.gold = Math.max(0, Math.floor(amount));
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function formatInt(n) {
  const x = Math.floor(Number(n) || 0);
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
