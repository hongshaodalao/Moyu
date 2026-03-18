import { fillRect } from './pixel.js';

export function renderEnemy(ctx, w, h, enemy, fx) {
  if (!enemy) return;

  const x = Math.floor(w * 0.70);
  const y = Math.floor(h * 0.66);

  const hit = fx?.enemyHitMs > 0;
  const body = hit ? '#f2f2f2' : '#6dd6ff';
  const body2 = hit ? '#d0d0d0' : '#3aa8d6';
  const dark = '#0b2230';

  const s = Math.floor(enemy.size);

  // shadow
  fillRect(ctx, x - s, y + s + 18, s * 2 + 10, 6, 'rgba(0,0,0,0.30)');

  // body block
  fillRect(ctx, x - s, y - s, s * 2, s * 2, body2);
  fillRect(ctx, x - s + 2, y - s + 2, s * 2 - 4, s * 2 - 4, body);

  // eyes
  fillRect(ctx, x - 8, y - 10, 5, 5, dark);
  fillRect(ctx, x + 3, y - 10, 5, 5, dark);

  // spikes (urchin-ish)
  for (let i = 0; i < 6; i++) {
    fillRect(ctx, x - s - 6 + i * 6, y - s - 8, 2, 8, body2);
  }
}

export function renderHpBar(ctx, x, y, w, h, ratio, fg, bg = 'rgba(0,0,0,0.35)') {
  fillRect(ctx, x, y, w, h, bg);
  fillRect(ctx, x, y, Math.max(0, Math.floor(w * Math.max(0, Math.min(1, ratio)))), h, fg);
}
