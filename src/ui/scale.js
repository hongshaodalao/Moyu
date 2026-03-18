const DESIGN_W = 1920;
const DESIGN_H = 1080;

export function applyScale() {
  const root = document.getElementById('scaleRoot');
  if (!root) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
  root.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

export function initScale() {
  applyScale();
  window.addEventListener('resize', applyScale, { passive: true });
}
