import { createGameState, addGold, setGold, formatInt, clamp } from './game/state.js';
import { initScale } from './ui/scale.js';
import { createShop, getUnlockedItems, tryBuy, computeShopTier, getItemById } from './game/shop.js';
import { createCombatState, updateCombat, applyCombatEquipment, restartRun } from './game/combat.js';
import { createLoop } from './game/loop.js';
import { loadSave, saveNow, hardReset, applyOfflineEarnings } from './game/save.js';
import { createSceneRenderer } from './render/scene.js';
import { createLobster } from './render/lobster.js';
import { renderEnemy, renderHpBar } from './render/enemy.js';

initScale();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const ui = {
  goldValue: document.getElementById('goldValue'),
  incomeValue: document.getElementById('incomeValue'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  shopList: document.getElementById('shopList'),
  shopMeta: document.getElementById('shopMeta'),
  tabEconomy: document.getElementById('tabEconomy'),
  tabCombat: document.getElementById('tabCombat'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  pageText: document.getElementById('pageText'),

  statHp: document.getElementById('statHp'),
  statAtk: document.getElementById('statAtk'),
  statDef: document.getElementById('statDef'),
  statAps: document.getElementById('statAps'),
  statWave: document.getElementById('statWave'),
  eqWeapon: document.getElementById('eqWeapon'),
  eqArmor: document.getElementById('eqArmor'),
  eqTrinket: document.getElementById('eqTrinket'),

  gameOver: document.getElementById('gameOver'),
  gameOverStats: document.getElementById('gameOverStats'),
  restartBtn: document.getElementById('restartBtn'),
  closeOverBtn: document.getElementById('closeOverBtn'),
};

const state = createGameState();
const shop = createShop();
const combat = createCombatState();

// Combat equipment bonuses are derived from owned items (new: battle gear).
const combatBonuses = {
  hpMax: 0,
  atk: 0,
  def: 0,
  atkSpeedPct: 0,
};

// Load save + apply offline
const saved = loadSave();
if (saved) {
  Object.assign(state, saved.statePatch);
  shop.applyOwned(saved.owned);
  if (saved.equipped) {
    shop.equipped.weapon = saved.equipped.weapon || null;
    shop.equipped.armor = saved.equipped.armor || null;
    shop.equipped.trinket = saved.equipped.trinket || null;
  }
  applyOfflineEarnings({ state, nowMs: Date.now() });
}

const scene = createSceneRenderer();
const lobster = createLobster();

function recomputeCombatBonusesFromEquipped() {
  combatBonuses.hpMax = 0;
  combatBonuses.atk = 0;
  combatBonuses.def = 0;
  combatBonuses.atkSpeedPct = 0;

  const ids = [shop.equipped.weapon, shop.equipped.armor, shop.equipped.trinket].filter(Boolean);
  for (const id of ids) {
    const item = getItemById(id);
    if (!item || !item.combatBonus) continue;
    combatBonuses.hpMax += item.combatBonus.hpMax || 0;
    combatBonuses.atk += item.combatBonus.atk || 0;
    combatBonuses.def += item.combatBonus.def || 0;
    combatBonuses.atkSpeedPct += item.combatBonus.atkSpeedPct || 0;
  }

  applyCombatEquipment(combat, combatBonuses);
}

// Restore scene effects from owned items on load
for (const id of shop.getOwned()) {
  const item = getItemById(id);
  if (item) scene.applyPurchase(item);
}
recomputeCombatBonusesFromEquipped();

let shopTab = 'economy';
let shopPage = 0;
const SHOP_PAGE_SIZE = 8;

function setShopTab(next) {
  shopTab = next;
  shopPage = 0;
  if (shopTab === 'economy') {
    ui.tabEconomy.classList.remove('secondary');
    ui.tabCombat.classList.add('secondary');
  } else {
    ui.tabEconomy.classList.add('secondary');
    ui.tabCombat.classList.remove('secondary');
  }
  renderShop();
}

// Shop is now always visible on the right panel.
function formatCombatBonus(b) {
  if (!b) return '战斗：—';
  const parts = [];
  if (b.atk) parts.push(`攻击 +${b.atk}`);
  if (b.def) parts.push(`防御 +${b.def}`);
  if (b.hpMax) parts.push(`生命上限 +${b.hpMax}`);
  if (b.atkSpeedPct) parts.push(`攻速 +${Math.round(b.atkSpeedPct * 100)}%`);
  return `战斗：${parts.join('，') || '—'}`;
}

function renderOwned() {}

function slotLabel(slot) {
  return slot === 'weapon' ? '武器' : slot === 'armor' ? '护甲' : '饰品';
}

function renderStats() {
  const p = combat.player;
  ui.statHp.textContent = `${p.hp}/${p.hpMax}`;
  ui.statAtk.textContent = `${p.atk}`;
  ui.statDef.textContent = `${p.def}`;
  ui.statAps.textContent = `${(1000 / p.atkIntervalMs).toFixed(2)} 次/秒`;
  ui.statWave.textContent = `${combat.wave} / ${combat.kills}`;

  const w = shop.equipped.weapon ? getItemById(shop.equipped.weapon)?.name : '无';
  const a = shop.equipped.armor ? getItemById(shop.equipped.armor)?.name : '无';
  const t = shop.equipped.trinket ? getItemById(shop.equipped.trinket)?.name : '无';
  ui.eqWeapon.textContent = w;
  ui.eqArmor.textContent = a;
  ui.eqTrinket.textContent = t;
}

function renderShop() {
  const tier = computeShopTier(state.autoIncome);
  const unlockedAll = getUnlockedItems(shop, state.autoIncome, shopTab);

  const totalPages = Math.max(1, Math.ceil(unlockedAll.length / SHOP_PAGE_SIZE));
  shopPage = Math.max(0, Math.min(shopPage, totalPages - 1));
  const unlocked = unlockedAll.slice(shopPage * SHOP_PAGE_SIZE, shopPage * SHOP_PAGE_SIZE + SHOP_PAGE_SIZE);

  ui.shopMeta.textContent = `店铺等级：${tier.name}（当前自动收益：+${state.autoIncome} / ${Math.round(state.incomePeriodMs / 100) / 10}s）`;
  if (ui.pageText) ui.pageText.textContent = `${shopPage + 1} / ${totalPages}`;
  if (ui.prevPage) ui.prevPage.disabled = shopPage <= 0;
  if (ui.nextPage) ui.nextPage.disabled = shopPage >= totalPages - 1;

  ui.shopList.innerHTML = '';
  for (const item of unlocked) {
    const canAfford = state.gold >= item.price;
    const el = document.createElement('div');
    el.className = 'card';

    const periodS = Math.round(state.incomePeriodMs / 100) / 10;
    const effectText = item.kind === 'combat'
      ? formatCombatBonus(item.combatBonus)
      : `自动收益 +${item.incomeBonus} / ${periodS}s`;

    el.innerHTML = `
      <div class="cardTop">
        <div>
          <div class="cardTitle">${item.name}</div>
          <div class="cardDesc">${item.desc}</div>
        </div>
        <div style="color:var(--accent); font-weight:800">${formatInt(item.price)} 金</div>
      </div>
      <div class="cardMeta">
        <div>${effectText}</div>
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

        // Auto-equip battle gear immediately
        if (item.kind === 'combat' && item.slot) {
          shop.equip(item.slot, item.id);
        }
        recomputeCombatBonusesFromEquipped();

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
  ui.incomeValue.textContent = `+${formatInt(state.autoIncome)} / ${Math.round(state.incomePeriodMs / 100) / 10}s`;
  renderStats();
}

function showGameOver() {
  const sec = Math.floor((Date.now() - combat.runStartMs) / 1000);
  ui.gameOverStats.textContent = `本局时长：${sec}s  ·  波次：${combat.wave}  ·  击杀：${combat.kills}`;
  ui.gameOver.classList.remove('hidden');
}
function hideGameOver() {
  ui.gameOver.classList.add('hidden');
}

ui.tabEconomy.addEventListener('click', () => setShopTab('economy'));
ui.tabCombat.addEventListener('click', () => setShopTab('combat'));
ui.prevPage.addEventListener('click', () => { shopPage = Math.max(0, shopPage - 1); renderShop(); });
ui.nextPage.addEventListener('click', () => { shopPage = shopPage + 1; renderShop(); });
// Save button removed (autosave covers it)
ui.restartBtn.addEventListener('click', () => {
  restartRun(combat);
  hideGameOver();
});
ui.closeOverBtn.addEventListener('click', hideGameOver);

ui.resetBtn.addEventListener('click', () => {
  const ok = confirm('确定要重置存档吗？这会清空金币与购买记录。');
  if (!ok) return;

  hardReset();

  // Also reset in-memory state immediately (so even if reload is blocked, UI updates).
  state.gold = 0;
  state.autoIncome = 10;
  state.incomePeriodMs = 3000;
  state.lastSeenMs = Date.now();
  shop.applyOwned([]);
  shop.unequip('weapon');
  shop.unequip('armor');
  shop.unequip('trinket');
  // easiest way to fully reset: hard reload to a cache-busting URL
  location.href = location.pathname + '?r=' + Date.now();
});

// If tab is hidden/minimized, browsers throttle timers & rAF.
// Use offline earnings logic on visibility/focus to keep progression consistent.
function syncOnReturn() {
  const now = Date.now();
  applyOfflineEarnings({ state, nowMs: now });
  saveNow({ state, shop });
  renderHUD();
  renderShop();
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
      // refresh afford states
      renderShop();
    }

    updateCombat({ state, combat }, dt);
    if (!combat.runActive && ui.gameOver.classList.contains('hidden')) {
      showGameOver();
    }

    lobster.update(dt);
    scene.update(dt);
  },
  render(alpha) {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    scene.render(ctx, canvas.width, canvas.height);

    // Combat HUD + enemy
    // Player HP bar
    const p = combat.player;
    renderHpBar(ctx, 18, 18, 220, 10, p.hp / p.hpMax, '#ff6b6b');
    ctx.fillStyle = 'rgba(230,240,255,0.92)';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    ctx.fillText(`HP ${p.hp}/${p.hpMax}`, 18, 14);

    // Enemy HP bar
    if (combat.enemy) {
      renderHpBar(ctx, canvas.width - 238, 18, 220, 10, combat.enemy.hp / combat.enemy.hpMax, '#6df2b0');
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      ctx.fillText(`${combat.enemy.hp}/${combat.enemy.hpMax}`, canvas.width - 238, 14);
    }

    // Entities
    lobster.render(ctx, canvas.width, canvas.height, combat.fx);
    renderEnemy(ctx, canvas.width, canvas.height, combat.enemy, combat.fx);

    // Text overlays
    ctx.fillStyle = 'rgba(230,240,255,0.9)';
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    ctx.fillText(`Wave ${combat.wave}  Kills ${combat.kills}`, 18, 48);
    if (combat.enemy) ctx.fillText(`${combat.enemy.name}`, canvas.width - 238, 48);

    if (combat.fx.dmgTextMs > 0 && combat.fx.lastDamageText) {
      ctx.fillStyle = 'rgba(255,213,106,0.9)';
      // If player was hit recently, show near lobster; otherwise near enemy.
      const nearPlayer = combat.fx.playerHitMs > 0;
      const tx = nearPlayer ? Math.floor(canvas.width * 0.52) : Math.floor(canvas.width * 0.70);
      const ty = nearPlayer ? Math.floor(canvas.height * 0.60) : Math.floor(canvas.height * 0.55);
      ctx.fillText(combat.fx.lastDamageText, tx, ty);
    }
  },
});

renderHUD();
loop.start();

// Periodic autosave
setInterval(() => saveNow({ state, shop }), 15000);
window.addEventListener('beforeunload', () => saveNow({ state, shop }));
