# NÉON

A minimalist neon brick breaker, **zero dependencies**, running in the browser
(HTML + `<canvas>`). A toy project used as a maintenance playground: it is
**playable but imperfect** (bugs, debt, partial tests).

## Run the game

The game uses ES modules (`import`), so it must be served over HTTP (opening it
as `file://` is not enough). A tiny zero-dependency server ships with the repo
(Node built-ins only):

```bash
npm run serve
# then open http://localhost:8000/ in the browser
# custom port: npm run serve -- 3000
```

Move the paddle with the mouse. The best score is stored locally in the browser.

## Run the tests

Unit tests via Node's built-in runner (no dependencies):

```bash
npm test
# equivalent to: node --test "game/**/*.test.js"
```

> Coverage is **partial** today (see `ISSUES.md`).

## Where to look

- `game/index.html` — the shell: page + `<canvas>` + boot.
- `game/neon.js` — the game logic **and** the rendering.
- `game/theme.js` — the color palette.
- `game/bloom.js` — the glow pass that gives the game its neon look.
- `game/neon.test.js` — the tests.

The backlog of known tasks is in `ISSUES.md`. The project conventions (including
the **zero-dependency** constraint) are in `CONTRIBUTING.md`.

## Local save

The best score is stored in `localStorage` under the key `neon.best` (a plain
integer). Any future score format must **stay compatible** with this existing
save.
