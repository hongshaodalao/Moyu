// Shop balancing: slow-burn.
// Prices scale a bit faster than income bonuses to avoid early collapse.

const TIERS = [
  { name: '海边小摊', minIncome: 0, label: 'T1' },
  { name: '海底集市', minIncome: 25, label: 'T2' },
  { name: '深海工坊', minIncome: 60, label: 'T3' },
  { name: '潮汐交易所', minIncome: 150, label: 'T4' },
  { name: '龙虾王宫后勤处', minIncome: 400, label: 'T5' },
];

// Items are organized by tier; each tier unlocks when autoIncome >= minIncome.
// Each item has a scene effect descriptor for the renderer.
const ITEMS = [
  // T1
  {
    id: 'shell-cup',
    tierMin: 0,
    name: '贝壳存钱罐',
    desc: '把零散金币“归拢起来”，效率提升一点点。',
    price: 40,
    incomeBonus: 2,
    sceneEffect: { type: 'prop', key: 'shellCup' },
  },
  {
    id: 'seaweed-mat',
    tierMin: 0,
    name: '海草垫子',
    desc: '躺得更舒服，摸鱼更持久。',
    price: 90,
    incomeBonus: 5,
    sceneEffect: { type: 'prop', key: 'seaweedMat' },
  },
  {
    id: 'tiny-claw-tool',
    tierMin: 0,
    name: '小钳子工具',
    desc: '整理工作流（假装），自动收益更稳。',
    price: 160,
    incomeBonus: 8,
    sceneEffect: { type: 'prop', key: 'clawTool' },
  },

  // T2
  {
    id: 'coral-lamp',
    tierMin: 25,
    name: '珊瑚小灯',
    desc: '照亮摸鱼角落，金币来得更勤。',
    price: 520,
    incomeBonus: 18,
    sceneEffect: { type: 'theme', key: 'warmGlow' },
  },
  {
    id: 'bubble-aerator',
    tierMin: 25,
    name: '气泡增压器',
    desc: '气泡越多，灵感越多（大概）。',
    price: 980,
    incomeBonus: 30,
    sceneEffect: { type: 'particle', key: 'moreBubbles' },
  },

  // T3
  {
    id: 'sunken-cache',
    tierMin: 60,
    name: '沉船小金库',
    desc: '传说中的“项目经费”，自动收益明显提升。',
    price: 3600,
    incomeBonus: 85,
    sceneEffect: { type: 'prop', key: 'sunkenCache' },
  },
  {
    id: 'octo-accountant',
    tierMin: 60,
    name: '章鱼会计',
    desc: '八只手同时记账，少丢几枚金币。',
    price: 6200,
    incomeBonus: 120,
    sceneEffect: { type: 'prop', key: 'octo' },
  },

  // T4
  {
    id: 'tide-engine',
    tierMin: 150,
    name: '潮汐引擎',
    desc: '借潮汐之力，让金币像海浪一样涌来。',
    price: 26000,
    incomeBonus: 420,
    sceneEffect: { type: 'theme', key: 'deepBlue' },
  },
  {
    id: 'reef-factory',
    tierMin: 150,
    name: '珊瑚工厂',
    desc: '规模化摸鱼（危险发言）。',
    price: 52000,
    incomeBonus: 800,
    sceneEffect: { type: 'prop', key: 'factory' },
  },

  // T5
  {
    id: 'royal-contract',
    tierMin: 400,
    name: '王宫外包合同',
    desc: '稳定现金流（并不稳定），但确实更赚钱。',
    price: 260000,
    incomeBonus: 4200,
    sceneEffect: { type: 'theme', key: 'royal' },
  },
];

export function computeShopTier(autoIncome) {
  // last tier whose minIncome <= autoIncome
  let t = TIERS[0];
  for (const tier of TIERS) {
    if (autoIncome >= tier.minIncome) t = tier;
  }
  return t;
}

export function createShop() {
  const owned = new Set();
  return {
    owned,
    applyOwned(list) {
      owned.clear();
      for (const id of list || []) owned.add(id);
    },
    getOwned() {
      return [...owned];
    },
    getOwnedCount() {
      return owned.size;
    },
    has(id) {
      return owned.has(id);
    },
  };
}

export function getUnlockedItems(shop, autoIncome) {
  return ITEMS
    .filter(i => autoIncome >= i.tierMin)
    .map(i => ({
      ...i,
      owned: shop.has(i.id),
      tierLabel: `解锁：+${i.tierMin}/5s`,
      price: shop.has(i.id) ? i.price : i.price,
    }))
    .filter(i => !i.owned);
}

export function tryBuy({ state, shop, id }) {
  const item = ITEMS.find(i => i.id === id);
  if (!item) return false;
  if (shop.has(id)) return false;
  if (state.gold < item.price) return false;

  state.gold -= item.price;
  state.autoIncome += item.incomeBonus;
  shop.owned.add(id);
  return true;
}

export function getItemById(id) {
  return ITEMS.find(i => i.id === id) || null;
}
