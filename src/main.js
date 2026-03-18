import { createGameState, addGold, setGold, formatInt, clamp } from './game/state.js';
import { createShop, getUnlockedItems, tryBuy, computeShopTier, getItemById } from './game/shop.js';
import { createLoop } from './game/loop.js';
import { loadSave, saveNow, hardReset, applyOfflineEarnings } from './game/save.js';
import { createSceneRenderer } from './render/scene.js';
import { createLobster } from './render/lobster.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const ui = {
  goldValue: document.getElementById('goldValue'),
  incomeValue: document.getElementById('incomeValue'),
  shopBtn: document.getElementById('shopBtn'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  panel: document.getElementById('panel'),
  closePanelBtn: document.getElementById('closePanelBtn'),
  shopList: document.getElementById('shopList'),
  shopMeta: document.getElementById('shopMeta'),
};

const state = createGameState();
const shop = createShop();

// Load save + apply offline
const saved = loadSave();
if (saved) {
  Object.assign(state, saved.statePatch);
  shop.applyOwned(saved.owned);
  applyOfflineEarnings({ state, nowMs: Date.now() });
}

const scene = createSceneRenderer();
const lobster = createLobster();

// Restore scene effects from owned items on load
for (const id of shop.getOwned()) {
  const item = getItemById(id);
  if (item) scene.applyPurchase(item);
}

function openShop() {
  ui.panel.classList.remove('hidden');
  renderShop();
}
function closeShop() {
  ui.panel.classList.add('hidden');
}

function renderShop() {
  const tier = computeShopTier(state.autoIncome);
  const unlocked = getUnlockedItems(shop, state.autoIncome);

  ui.shopMeta.textContent = `店铺等级：${tier.name}（当前自动收益：+${state.autoIncome} / 5s）  ·  已拥有：${shop.getOwnedCount()} 件`;

  ui.shopList.innerHTML = '';
  for (const item of unlocked) {
    const canAfford = state.gold >= item.price;
    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <div class="cardTop">
        <div>
          <div class="cardTitle">${item.name}</div>
          <div class="cardDesc">${item.desc}</div>
        </div>
        <div style="color:var(--accent); font-weight:800">${formatInt(item.price)} 金</div>
      </div>
      <div class="cardMeta">
        <div>收益 +${item.incomeBonus} / 5s</div>
        <div>${item.tierLabel}</div>
      </div>
      <div class="cardBuy">
        <button class="btn buyBtn" ${canAfford ? '' : 'disabled'} data-id="${item.id}">购买</button>
      </div>
    `;

    el.querySelector('button').addEventListener('click', () => {
      const ok = tryBuy({ state, shop, id: item.id });
      if (ok) {
        // Apply scene changes
        scene.applyPurchase(item);
        saveNow({ state, shop });
        renderShop();
        renderHUD();
      }
    });

    ui.shopList.appendChild(el);
  }
}

function renderHUD() {
  ui.goldValue.textContent = formatInt(state.gold);
  ui.incomeValue.textContent = `+${formatInt(state.autoIncome)} / 5s`;
}

ui.shopBtn.addEventListener('click', () => {
  if (ui.panel.classList.contains('hidden')) openShop();
  else closeShop();
});
ui.closePanelBtn.addEventListener('click', closeShop);
ui.saveBtn.addEventListener('click', () => saveNow({ state, shop }));
ui.resetBtn.addEventListener('click', () => {
  const ok = confirm('确定要重置存档吗？这会清空金币与购买记录。');
  if (!ok) return;
  hardReset();
  location.reload();
});

// If tab is hidden/minimized, browsers throttle timers & rAF.
// Use offline earnings logic on visibility/focus to keep progression consistent.
function syncOnReturn() {
  const now = Date.now();
  applyOfflineEarnings({ state, nowMs: now });
  saveNow({ state, shop });
  renderHUD();
  if (!ui.panel.classList.contains('hidden')) renderShop();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveNow({ state, shop });
  } else {
    syncOnReturn();
  }
});
window.addEventListener('focus', syncOnReturn);
window.addEventListener('blur', () => saveNow({ state, shop }));

// Auto income: every 5s
function tickIncome() {
  addGold(state, state.autoIncome);
}

let incomeAcc = 0;

const loop = createLoop({
  update(dt) {
    incomeAcc += dt;
    while (incomeAcc >= state.incomePeriodMs) {
      incomeAcc -= state.incomePeriodMs;
      tickIncome();
      renderHUD();
      // if shop open, refresh afford states
      if (!ui.panel.classList.contains('hidden')) renderShop();
    }

    lobster.update(dt);
    scene.update(dt);
  },
  render(alpha) {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    scene.render(ctx, canvas.width, canvas.height);
    lobster.render(ctx, canvas.width, canvas.height);

    // small floating text if needed later
  },
});

renderHUD();
loop.start();

// Periodic autosave
setInterval(() => saveNow({ state, shop }), 15000);
window.addEventListener('beforeunload', () => saveNow({ state, shop }));
