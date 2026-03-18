// Integer (pixel-perfect) scaling for the canvas inside the scene pane.
// Keeps crisp pixels by scaling the canvas CSS size to an integer multiple
// of its internal resolution.

export function applyPixelPerfectCanvasScale(canvas, container) {
  if (!canvas || !container) return;

  const rect = container.getBoundingClientRect();
  const cw = Math.floor(rect.width);
  const ch = Math.floor(rect.height);

  const baseW = canvas.width;
  const baseH = canvas.height;

  // compute integer scale that fits
  const s = Math.max(1, Math.floor(Math.min(cw / baseW, ch / baseH)));

  const w = baseW * s;
  const h = baseH * s;

  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

export function initPixelPerfectCanvas(canvas, container) {
  applyPixelPerfectCanvasScale(canvas, container);
  window.addEventListener('resize', () => applyPixelPerfectCanvasScale(canvas, container), { passive: true });
}
