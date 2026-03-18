const SAVE_KEY = 'moyu.save.v1';
const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000; // 2 hours

export function saveNow({ state, shop }) {
  state.lastSeenMs = Date.now();
  const payload = {
    v: 1,
    state: {
      gold: state.gold,
      autoIncome: state.autoIncome,
      incomePeriodMs: state.incomePeriodMs,
      lastSeenMs: state.lastSeenMs,
    },
    owned: shop.getOwned(),
    equipped: shop.equipped,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return null;

    return {
      statePatch: {
        gold: Number(parsed.state?.gold ?? 0),
        autoIncome: Number(parsed.state?.autoIncome ?? 10),
        incomePeriodMs: Number(parsed.state?.incomePeriodMs ?? 3000),
        lastSeenMs: Number(parsed.state?.lastSeenMs ?? Date.now()),
      },
      owned: parsed.owned || [],
      equipped: parsed.equipped || null,
    };
  } catch {
    return null;
  }
}

export function applyOfflineEarnings({ state, nowMs }) {
  const last = Number(state.lastSeenMs || nowMs);
  const delta = Math.max(0, nowMs - last);
  const effective = Math.min(delta, OFFLINE_CAP_MS);

  // periods are discrete: every incomePeriodMs earns autoIncome
  const periods = Math.floor(effective / state.incomePeriodMs);
  if (periods <= 0) {
    state.lastSeenMs = nowMs;
    return;
  }

  state.gold = Math.floor(state.gold + periods * state.autoIncome);
  state.lastSeenMs = nowMs;
}

export function hardReset() {
  // Remove current save
  localStorage.removeItem(SAVE_KEY);

  // Robust reset: sometimes multiple keys exist due to dev iterations.
  // Only remove our own keys (prefix moyu.).
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith('moyu.')) localStorage.removeItem(k);
  }

  // Best-effort: also clear service worker caches if any (future-proof)
  // (No SW is registered today.)
}
