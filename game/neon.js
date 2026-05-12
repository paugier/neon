// neon.js — boot for the NÉON brick breaker (zero dependencies).
// For now: just the shell (dimensions + a boot that paints the background).
// Gameplay comes in a later commit.

export const WIDTH = 640;
export const HEIGHT = 480;

// Browser entry point: wires up the canvas and paints the background.
export function boot(doc = document) {
  const canvas = doc.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  ctx.fillStyle = '#0a0118';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#ff2d95';
  ctx.font = '20px monospace';
  ctx.fillText('NÉON — playable soon', 200, HEIGHT / 2);
}
