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

`frame()` (in `game/neon.js`) destroys the brick it hits but never touches the
ball's velocity: only the walls and the paddle bounce (`step()`). The whole
collision resolution has to be fixed, not just the visible symptom.

- **per face**: the axis with the *smaller* penetration is the face that was hit -
  flip `vy` on a top/bottom hit, `vx` on a side hit, and leave the other
  component exactly as it was;
- **corner**: equal penetrations means a diagonal hit - flip both components;
- **push out**: reposition the ball outside the brick rectangle, otherwise it
  still overlaps on the next frame and re-flips forever (sticky bounce);
- **neighbours**: the grid gap is 8 px and the ball 14 px across, so every seam
  overlaps two bricks in the *same* pass - the bounce must apply exactly once
  (`vy = -vy` applied twice cancels out and the ball goes through);
- **tunnelling**: detection is discrete (position before / after the move). At
  level 6, `ballSpeed(6)` = 710 px/s and a stuttered frame is capped at 50 ms:
  35.5 px per step against 34 px to cross (`BRICK_H` + diameter), so the ball
  jumps over the brick without ever touching it. Sweep between the two positions.

**Reproduce**: send the ball into a group of bricks; a near-horizontal shot (hit
the paddle near its edge) makes the side case obvious. **Expected**: each case
above added **first as a red test**, then green.

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
