export function createLoop({ update, render }) {
  let last = performance.now();
  let running = false;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(64, now - last); // cap
    last = now;

    update(dt);
    render(1);

    requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
}
