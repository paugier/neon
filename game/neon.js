// neon.js — NÉON, a minimalist brick breaker (zero dependencies).
//
// Brick collision detection lives inside the draw loop `frame()`: logic and
// rendering are mixed. We accept that for now.
//
// The module runs nothing on import: only `boot()` touches the DOM.

// --- Field constants -------------------------------------------------------

export const WIDTH = 640;
export const HEIGHT = 480;

export const PADDLE_W = 96;
export const PADDLE_H = 12;
export const PADDLE_Y = HEIGHT - 32;

export const BALL_R = 7;

export const BRICK_ROWS = 5;
export const BRICK_COLS = 8;
export const BRICK_W = 72;
export const BRICK_H = 20;
export const BRICK_GAP = 8;
export const BRICK_TOP = 48;

const STORAGE_KEY = 'neon.best';

// --- State construction ----------------------------------------------------

// Builds the brick grid for a given level.
// The higher the level, the more points bricks are worth.
export function makeBricks(level = 1) {
  const bricks = [];
  const offsetX = (WIDTH - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        x: offsetX + col * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        row,
        alive: true,
        points: (BRICK_ROWS - row) * 10 * level,
      });
    }
  }
  return bricks;
}

// Ball speed as a function of the level.
export function ballSpeed(level = 1) {
  return 260 + (level - 1) * 90;
}

// Creates a fresh game state.
export function createState(level = 1) {
  const speed = ballSpeed(level);
  return {
    level,
    lives: 3,
    score: 0,
    combo: 0,
    best: 0,
    running: false,
    paddle: { x: (WIDTH - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
    ball: { x: WIDTH / 2, y: PADDLE_Y - BALL_R - 2, r: BALL_R, vx: speed * 0.5, vy: -speed },
    bricks: makeBricks(level),
  };
}

// --- Collision -------------------------------------------------------------

// True if the ball overlaps the brick (AABB test on the current position).
export function collides(ball, brick) {
  return (
    ball.x + ball.r > brick.x &&
    ball.x - ball.r < brick.x + brick.w &&
    ball.y + ball.r > brick.y &&
    ball.y - ball.r < brick.y + brick.h
  );
}

// --- Score & combo ---------------------------------------------------------

// Combo multiplier (unbounded for now).
export function comboMultiplier(combo) {
  return 1 + combo * 0.5;
}

// Points earned for breaking a brick, combo included.
export function scoreForBrick(brick, combo) {
  return Math.round(brick.points * comboMultiplier(combo));
}

// --- Best score persistence ------------------------------------------------

// Reads the best score; robust to corrupted or missing storage (=> 0).
export function loadBest(storage) {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

// Writes the best score if the current score beats it. Returns the updated best.
export function saveBest(storage, score) {
  const best = loadBest(storage);
  if (score > best && storage) {
    try {
      storage.setItem(STORAGE_KEY, String(score));
    } catch {
      // storage unavailable (private mode, quota): silently ignore
    }
    return score;
  }
  return best;
}

// --- Physics (movement + wall/paddle bounces) ------------------------------

// Advances the ball by a step `dt` and handles walls + paddle (not bricks).
// Returns `true` if the ball is lost (exits through the bottom).
export function step(state, dt) {
  const { ball, paddle } = state;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > WIDTH) {
    ball.x = WIDTH - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  if (
    ball.vy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w
  ) {
    ball.y = paddle.y - ball.r;
    ball.vy = -Math.abs(ball.vy);
    const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = ballSpeed(state.level) * 0.6 * hit;
    state.combo = 0; // touching the paddle resets the combo
  }

  if (ball.y - ball.r > HEIGHT) {
    return true;
  }
  return false;
}

// --- Rendering (DOM): brick collision STILL mixed in here ------------------

const BRICK_COLORS = ['#ff2d95', '#ff8a00', '#ffe600', '#39ff14', '#00e5ff'];

function frame(ctx, state) {
  ctx.fillStyle = '#0a0118';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const brick of state.bricks) {
    if (!brick.alive) continue;

    if (collides(state.ball, brick)) {
      brick.alive = false;
      state.combo += 1;
      state.score += scoreForBrick(brick, state.combo);
      // TODO: bounce the ball off the brick (only walls/paddle bounce for now).
    }

    ctx.fillStyle = BRICK_COLORS[brick.row % BRICK_COLORS.length];
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
  }

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);

  ctx.fillStyle = '#39ff14';
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5f5ff';
  ctx.font = '16px monospace';
  ctx.fillText(`Score ${state.score}`, 12, 24);
  ctx.fillText(`Best ${state.best}`, WIDTH - 110, 24);
  ctx.fillText(`Lives ${state.lives}`, WIDTH / 2 - 30, 24);
}

// --- Boot ------------------------------------------------------------------

export function boot(doc = document) {
  const canvas = doc.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const state = createState(1);
  state.best = loadBest(globalThis.localStorage);
  state.running = true;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - state.paddle.w / 2;
    state.paddle.x = Math.max(0, Math.min(WIDTH - state.paddle.w, x));
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (state.running) {
      const lost = step(state, dt);
      if (lost) {
        state.lives -= 1;
        state.combo = 0;
        if (state.lives <= 0) {
          state.best = saveBest(globalThis.localStorage, state.score);
          Object.assign(state, createState(state.level));
          state.best = loadBest(globalThis.localStorage);
        } else {
          state.ball = createState(state.level).ball;
        }
      }
      if (state.bricks.every((b) => !b.alive)) {
        state.level += 1;
        state.bricks = makeBricks(state.level);
        state.ball = createState(state.level).ball;
      }
    }

    frame(ctx, state);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return state;
}
