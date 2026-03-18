import { addGold, clamp } from './state.js';

// Single-enemy endless combat MVP.
// Player and enemy auto-attack on timers; no player input required.

export function createCombatState() {
  return {
    runActive: true,
    runStartMs: Date.now(),

    wave: 1,
    kills: 0,

    player: {
      hpMax: 420,
      hp: 420,
      atk: 12,
      def: 4,
      atkIntervalMs: 900, // ~1.11 atk/s
      critChance: 0,
      critMult: 1.5,
    },

    enemy: createEnemy(1),

    timers: {
      pAtkCd: 0,
      eAtkCd: 0,
      respawnCd: 0,
    },

    fx: {
      playerHitMs: 0,
      enemyHitMs: 0,
      lastDamageText: null,
      dmgTextMs: 0,
    },
  };
}

export function createEnemy(wave) {
  // slow-burn growth: enemy gets tougher a bit faster than reward.
  const hp = Math.floor(46 * Math.pow(1.16, wave - 1));
  const atk = Math.floor(2.6 * Math.pow(1.07, wave - 1));
  const atkIntervalMs = Math.max(880, Math.floor(1280 * Math.pow(0.996, wave - 1)));
  const goldReward = Math.floor(10 * Math.pow(1.13, wave - 1));

  // visual size scales slightly
  const size = clamp(18 + wave * 0.25, 18, 32);

  return {
    wave,
    name: pickEnemyName(wave),
    hpMax: hp,
    hp,
    atk,
    def: Math.floor(Math.pow(1.04, wave - 1)),
    atkIntervalMs,
    goldReward,
    size,
  };
}

function pickEnemyName(wave) {
  const pool = [
    '海胆小兵',
    '沙蟹流氓',
    '泡泡水母',
    '礁石刺客',
    '深海鳗鱼',
    '沉船幽影',
  ];
  if (wave <= pool.length) return pool[wave - 1];
  return pool[(wave - 1) % pool.length];
}

export function applyCombatEquipment(combat, bonuses) {
  // bonuses: {hpMax, atk, def, atkSpeedPct}
  const p = combat.player;
  // IMPORTANT: base stats must match createCombatState() for consistency.
  const baseHp = 420;
  const baseAtk = 12;
  const baseDef = 4;
  const baseInterval = 900;

  p.hpMax = baseHp + (bonuses.hpMax || 0);
  p.atk = baseAtk + (bonuses.atk || 0);
  p.def = baseDef + (bonuses.def || 0);

  const speed = 1 + (bonuses.atkSpeedPct || 0);
  p.atkIntervalMs = clamp(Math.floor(baseInterval / speed), 220, 1800);

  p.hp = clamp(p.hp, 0, p.hpMax);
}

export function restartRun(combat) {
  combat.runActive = true;
  combat.runStartMs = Date.now();
  combat.wave = 1;
  combat.kills = 0;
  combat.player.hp = combat.player.hpMax;
  combat.enemy = createEnemy(1);
  combat.timers.pAtkCd = 0;
  combat.timers.eAtkCd = 0;
  combat.timers.respawnCd = 500;
  combat.fx.playerHitMs = 0;
  combat.fx.enemyHitMs = 0;
  combat.fx.lastDamageText = null;
  combat.fx.dmgTextMs = 0;
}

export function updateCombat({ state, combat }, dt) {
  // dt in ms
  if (!combat.runActive) {
    // still tick FX
    combat.fx.playerHitMs = Math.max(0, combat.fx.playerHitMs - dt);
    combat.fx.enemyHitMs = Math.max(0, combat.fx.enemyHitMs - dt);
    combat.fx.dmgTextMs = Math.max(0, combat.fx.dmgTextMs - dt);
    return;
  }

  const p = combat.player;
  const e = combat.enemy;

  combat.fx.playerHitMs = Math.max(0, combat.fx.playerHitMs - dt);
  combat.fx.enemyHitMs = Math.max(0, combat.fx.enemyHitMs - dt);
  combat.fx.dmgTextMs = Math.max(0, combat.fx.dmgTextMs - dt);

  // respawn handling
  if (!e) {
    combat.timers.respawnCd -= dt;
    if (combat.timers.respawnCd <= 0) {
      combat.enemy = createEnemy(combat.wave);
      combat.timers.respawnCd = 0;
    }
    return;
  }

  // Player attacks
  combat.timers.pAtkCd -= dt;
  if (combat.timers.pAtkCd <= 0) {
    combat.timers.pAtkCd += p.atkIntervalMs;
    const dmg = calcDamage(p.atk, e.def);
    e.hp -= dmg;
    combat.fx.enemyHitMs = 120;
    combat.fx.lastDamageText = `-${dmg}`;
    combat.fx.dmgTextMs = 450;
  }

  // Enemy attacks
  combat.timers.eAtkCd -= dt;
  if (combat.timers.eAtkCd <= 0) {
    combat.timers.eAtkCd += e.atkIntervalMs;
    const dmg = calcDamage(e.atk, p.def);
    p.hp -= dmg;
    combat.fx.playerHitMs = 160;
    combat.fx.lastDamageText = `-${dmg}`;
    combat.fx.dmgTextMs = 450;
  }

  // Resolve kills
  if (e.hp <= 0) {
    combat.kills += 1;
    addGold(state, e.goldReward);
    combat.wave += 1;
    combat.enemy = null;
    combat.timers.respawnCd = 650;
    return;
  }

  // Resolve death
  if (p.hp <= 0) {
    p.hp = 0;
    combat.runActive = false;
  }
}

function calcDamage(atk, targetDef) {
  // smoother mitigation: DEF gives diminishing returns but feels impactful.
  // damage = atk * 100 / (100 + def*25)
  const mitigated = Math.ceil((atk * 100) / (100 + Math.max(0, targetDef) * 25));
  return Math.max(1, mitigated);
}
