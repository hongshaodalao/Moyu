export function setPixelStyle(ctx) {
  ctx.imageSmoothingEnabled = false;
}

export function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function drawText(ctx, text, x, y, color = '#e6f0ff') {
  ctx.fillStyle = color;
  ctx.font = '16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  ctx.fillText(text, Math.floor(x), Math.floor(y));
}
