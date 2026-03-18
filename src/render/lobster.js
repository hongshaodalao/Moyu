import { fillRect } from './pixel.js';

// Programmatic pixel lobster with idle random animations.

const ACTIONS = [
  { key: 'blink', minMs: 2200, maxMs: 5200, durMs: 180, weight: 6 },
  { key: 'claw', minMs: 2600, maxMs: 6200, durMs: 520, weight: 4 },
  { key: 'hop', minMs: 4500, maxMs: 8500, durMs: 420, weight: 2 },
  { key: 'bubble', minMs: 5500, maxMs: 9800, durMs: 700, weight: 1 },
  { key: 'flop', minMs: 9000, maxMs: 16000, durMs: 900, weight: 1 },
];

function pickWeighted(list) {
  const sum = list.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * sum;
  for (const it of list) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return list[0];
}

export function createLobster() {
  let nextActionIn = 1200;
  let action = null;
  let actionLeft = 0;

  // bubble particles local to lobster
  const bubbles = [];

  function doAction(a) {
    action = a.key;
    actionLeft = a.durMs;
  }

  return {
    update(dt) {
      if (actionLeft > 0) {
        actionLeft -= dt;
        if (actionLeft <= 0) {
          actionLeft = 0;
          action = null;
          // schedule next
          const a = pickWeighted(ACTIONS);
          nextActionIn = a.minMs + Math.random() * (a.maxMs - a.minMs);
        }
      } else {
        nextActionIn -= dt;
        if (nextActionIn <= 0) {
          const a = pickWeighted(ACTIONS);
          doAction(a);
        }
      }

      // update bubbles
      for (const b of bubbles) {
        b.y -= (b.vy * dt) / 1000;
        b.x += (b.vx * dt) / 1000;
        b.life -= dt;
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        if (bubbles[i].life <= 0) bubbles.splice(i, 1);
      }

      // bubble action spawns
      if (action === 'bubble' && Math.random() < 0.12) {
        bubbles.push({ x: 0, y: 0, vx: -8 + Math.random() * 16, vy: 28 + Math.random() * 18, life: 700 + Math.random() * 500 });
      }
    },

    render(ctx, w, h) {
      // anchor near center-bottom
      const baseX = Math.floor(w * 0.52);
      const baseY = Math.floor(h * 0.70);

      let yBob = 0;
      let clawLift = 0;
      let eyeClosed = false;
      let flop = false;

      if (action === 'hop') yBob = -6;
      if (action === 'claw') clawLift = -4;
      if (action === 'blink') eyeClosed = true;
      if (action === 'flop') flop = true;

      // draw bubbles from mouth
      for (const b of bubbles) {
        const bx = baseX + 24 + b.x;
        const by = baseY - 20 + b.y;
        fillRect(ctx, bx, by, 3, 3, 'rgba(190,220,255,0.65)');
      }

      // lobster body (simple pixel art)
      // Colors
      const red1 = '#d14a4a';
      const red2 = '#b53a3a';
      const red3 = '#8f2a2a';
      const dark = '#3b1a1a';

      const x = baseX;
      const y = baseY + yBob;

      // shadow
      fillRect(ctx, x - 18, y + 30, 60, 6, 'rgba(0,0,0,0.35)');

      // abdomen
      if (!flop) {
        fillRect(ctx, x, y, 36, 22, red2);
        fillRect(ctx, x + 2, y + 2, 32, 18, red1);
        fillRect(ctx, x + 10, y + 6, 16, 4, red2);
      } else {
        // flop = tilt sideways
        fillRect(ctx, x - 4, y + 6, 44, 18, red2);
        fillRect(ctx, x - 2, y + 8, 40, 14, red1);
      }

      // tail
      fillRect(ctx, x - 10, y + 6, 12, 12, red3);
      fillRect(ctx, x - 6, y + 10, 8, 4, red2);

      // head
      fillRect(ctx, x + 30, y + 4, 20, 14, red2);
      fillRect(ctx, x + 32, y + 6, 16, 10, red1);

      // eyes
      fillRect(ctx, x + 40, y - 6, 4, 10, red3);
      fillRect(ctx, x + 46, y - 6, 4, 10, red3);
      if (!eyeClosed) {
        fillRect(ctx, x + 40, y - 2, 4, 4, dark);
        fillRect(ctx, x + 46, y - 2, 4, 4, dark);
      } else {
        fillRect(ctx, x + 40, y + 2, 4, 2, dark);
        fillRect(ctx, x + 46, y + 2, 4, 2, dark);
      }

      // legs
      for (let i = 0; i < 4; i++) {
        fillRect(ctx, x + 6 + i * 7, y + 20, 4, 10, red3);
      }

      // claws
      // left arm
      fillRect(ctx, x + 24, y + 16, 10, 4, red3);
      // right arm
      fillRect(ctx, x + 42, y + 16, 10, 4, red3);

      // left claw
      fillRect(ctx, x + 14, y + 12 + clawLift, 12, 10, red2);
      fillRect(ctx, x + 12, y + 10 + clawLift, 8, 4, red3);

      // right claw
      fillRect(ctx, x + 52, y + 12 + clawLift, 12, 10, red2);
      fillRect(ctx, x + 56, y + 10 + clawLift, 8, 4, red3);

      // sparkle when royal theme later could be added
    },
  };
}
