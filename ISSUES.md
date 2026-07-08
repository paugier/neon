# NÉON backlog

List of known tasks in the repo. Each entry is a real maintenance request: a
bug to fix, debt to pay down, or a feature to add.

| #   | Type         | Title                                                                        |
| --- | ------------ | ---------------------------------------------------------------------------- |
| 1   | bug          | The ball **plows through** bricks instead of bouncing (no brick bounce)      |
| 2   | perf/quality | Collision scans **all** bricks every frame, code entangled with rendering    |
| 3   | feature      | **Night mode**                                                               |
| 4   | feature      | **CSV import** of a score table, compatible with the current local save      |
| 5   | debt         | The **score/combo logic is not tested**                                      |
| 6   | debt         | **Hard-coded** colors instead of the palette (theme inconsistency)           |

---

## #1 — bug: the ball plows through bricks instead of bouncing

The ball is **never deflected by bricks**. Only the walls and the paddle bounce
the ball (in `step()`); the brick bounce was never implemented (`frame()` in
`game/neon.js` destroys the brick but does not change the ball's velocity). Two
very visible symptoms:

- **head-on** (A): the ball punches straight through a whole column in a line,
  without bouncing back;
- **from the side** (B): the ball saws straight through the side of a row
  instead of bouncing off it.

Detail:

- **Reproduce**: start a game and send the ball into any group of bricks — it
  goes straight through them. A near-horizontal shot (hit the paddle near its
  edge) makes the side case obvious.
- **Lead**: give bricks a real **per-face** bounce — compare the horizontal vs
  vertical penetration to know which face was hit, flip the matching axis
  (`vy` for top/bottom, `vx` for a side), and push the ball back out of the
  brick.
- **Expected**: edge cases added **first as red tests** (a top/bottom hit flips
  `vy`; a side hit flips `vx`), then green.

## #2 — perf/quality: collision entangled with rendering

Brick collision detection lives inside the draw loop (`frame()` in
`game/neon.js`): logic and rendering are mixed, and we scan every brick on
every frame.

- **Expected**: extract a **pure**, testable function `brickHit(ball, bricks)`,
  **without changing the public API** (the already-exported functions).

## #3 — feature: night mode

Add a **night mode** (a darker / higher-contrast palette variant), toggleable.
It must build on `theme.js` (see #6) rather than on hard-coded colors.

## #4 — feature: CSV import of a score table

Allow importing a CSV of scores and displaying a sorted **Top 5**.

- **Mandatory compatibility**: the current local save (`neon.best`, an integer
  under that `localStorage` key) must **still be read** (no regression).
- **Expected**: `topScores` sorted and truncated to 5, persistent.

## #5 — debt: score/combo not tested

`comboMultiplier` and `scoreForBrick` (in `game/neon.js`) have **no tests**. The
combo multiplier is also **not bounded**.

- **Expected**: cover the logic with tests, then ship a small improvement
  (**clamp** the multiplier) *only if the tests pass*.

## #6 — debt: hard-coded colors

`game/theme.js` exposes a palette, but `game/neon.js` still hard-codes some
colors (paddle, ball). Theme inconsistency.

- **Expected**: route all colors through the palette, without introducing any
  color outside the palette.
