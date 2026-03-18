import { fillRect } from './pixel.js';

export function createSceneRenderer() {
  const props = new Set();
  const themes = new Set();
  const particles = {
    moreBubbles: false,
  };

  let bubbleAcc = 0;
  const bubbleList = [];

  function spawnBubble(w, h) {
    bubbleList.push({
      x: Math.random() * w,
      y: h + 10,
      r: 2 + Math.random() * 3,
      vy: 12 + Math.random() * 18,
      a: 0.35 + Math.random() * 0.4,
    });
  }

  function themeColors() {
    if (themes.has('royal')) return { top: '#160a2b', mid: '#06152a', bottom: '#02040a' };
    if (themes.has('deepBlue')) return { top: '#041427', mid: '#062338', bottom: '#02040a' };
    return { top: '#05101a', mid: '#062034', bottom: '#02040a' };
  }

  return {
    applyPurchase(item) {
      const fx = item.sceneEffect;
      if (!fx) return;
      if (fx.type === 'prop') props.add(fx.key);
      if (fx.type === 'theme') themes.add(fx.key);
      if (fx.type === 'particle') particles[fx.key] = true;
    },

    update(dt) {
      // bubbles
      bubbleAcc += dt;
      const baseRate = particles.moreBubbles ? 120 : 220;
      while (bubbleAcc >= baseRate) {
        bubbleAcc -= baseRate;
        // lazy: size will be set at render time
        spawnBubble(960, 540);
      }
      for (const b of bubbleList) {
        b.y -= (b.vy * dt) / 1000;
      }
      // cull
      for (let i = bubbleList.length - 1; i >= 0; i--) {
        if (bubbleList[i].y < -20) bubbleList.splice(i, 1);
      }
    },

    render(ctx, w, h) {
      const c = themeColors();

      // background gradient (pixel-ish bands)
      fillRect(ctx, 0, 0, w, h, c.bottom);
      for (let y = 0; y < h; y += 6) {
        const t = y / h;
        const col = t < 0.5 ? c.top : c.mid;
        fillRect(ctx, 0, y, w, 6, col);
      }

      // seabed
      fillRect(ctx, 0, h - 90, w, 90, '#062012');
      for (let x = 0; x < w; x += 10) {
        fillRect(ctx, x, h - 90 + (x % 20 === 0 ? 6 : 10), 10, 2, 'rgba(255,255,255,0.06)');
      }

      // props (simple pixel blocks for now)
      // positions are fixed to keep composition stable
      if (props.has('shellCup')) {
        fillRect(ctx, 120, h - 140, 34, 26, '#b8b2a6');
        fillRect(ctx, 126, h - 146, 22, 8, '#d6d0c5');
        fillRect(ctx, 132, h - 132, 10, 8, '#8a6b2a');
      }
      if (props.has('seaweedMat')) {
        fillRect(ctx, 240, h - 118, 90, 10, '#0c7a3d');
        fillRect(ctx, 252, h - 128, 10, 10, '#0c7a3d');
        fillRect(ctx, 270, h - 132, 10, 14, '#0c7a3d');
      }
      if (props.has('clawTool')) {
        fillRect(ctx, 70, h - 120, 22, 10, '#6b7a8a');
        fillRect(ctx, 84, h - 132, 6, 18, '#6b7a8a');
      }
      if (props.has('sunkenCache')) {
        fillRect(ctx, w - 180, h - 138, 70, 40, '#3a2b18');
        fillRect(ctx, w - 176, h - 134, 62, 32, '#5a4224');
        fillRect(ctx, w - 160, h - 120, 30, 10, '#caa54a');
      }
      if (props.has('octo')) {
        fillRect(ctx, w - 260, h - 150, 26, 26, '#7d3aa3');
        fillRect(ctx, w - 272, h - 130, 10, 18, '#6b2f90');
        fillRect(ctx, w - 234, h - 130, 10, 18, '#6b2f90');
      }
      if (props.has('factory')) {
        fillRect(ctx, w - 330, h - 170, 96, 70, '#243447');
        fillRect(ctx, w - 320, h - 190, 24, 20, '#2e4760');
        fillRect(ctx, w - 280, h - 182, 16, 12, '#ffd56a');
      }

      // warm glow overlay
      if (themes.has('warmGlow')) {
        fillRect(ctx, 0, 0, w, 60, 'rgba(255, 213, 106, 0.06)');
      }

      // bubbles
      for (const b of bubbleList) {
        fillRect(ctx, b.x, b.y, b.r, b.r, `rgba(190,220,255,${b.a})`);
      }

      // vignette
      fillRect(ctx, 0, 0, w, 4, 'rgba(0,0,0,0.4)');
      fillRect(ctx, 0, h - 4, w, 4, 'rgba(0,0,0,0.55)');
    },
  };
}
