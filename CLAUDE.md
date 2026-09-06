# CLAUDE.md

Working notes for this repo. Read before editing.

## What this is

A js13k entry: Speedball 2 with unicorns. One HTML file, no assets; everything
is generated from code at runtime. **The zipped build must stay under 13,312
bytes.** Assume every change costs bytes and measure with `npm run pack`.

## Commands

    npm install
    npm run dev      # writes dev.html; open it in a browser
    npm run size     # per-module byte table
    npm run pack     # terser + roadroller + zip, prints budget status
    npm test         # headless match under node-canvas, every screen, text fits

## Rules that will bite you

- **Module order is load-bearing.** `src/*.js` are concatenated in filename
  order into one scope. Top-level `const` and `let` initialise in sequence;
  insert new modules at a free number, never renumber.
- **Top-level names clash silently at build time.** `fit`, `act`, `look`,
  `wipe`, `gh`, `prism` are taken; a duplicate is a `SyntaxError` in the packed
  scope, not a helpful message. Grep before adding a name.
- **The packer is deterministic.** `tools/heatmap-params.json` freezes the
  Roadroller parameters, so a 5 B difference is a real 5 B. After a large
  change, `node tools/build.js --roadroller --reopt` searches again; paste the
  result into the JSON if it packs smaller.
- **The decoder uses bare globals**, so no element may have a single-letter
  `id`. The canvas is `id=cv`.
- **Only distinct code costs bytes.** Roadroller models repeated text almost
  perfectly: hoisting constants, packing data into strings or generating
  patterns all measured larger than the plain literals. Minified size is not
  the budget; measure the zip.
- **Colours use the comma form** `hsla(h,s%,l%,a)` via `C()`; the space form
  breaks node-canvas and the headless test.
- **Tap zones must match draw coordinates.** Menu hit-testing in `60_input.js`
  duplicates the y-offsets `82_screens.js` draws at. Change both together.
- **Node harnesses need three shims**: `document.createElement` for the
  offscreen sprite canvas, `g.lit = 1` for the click-to-start gate and
  `g.skipT = 1` for the tutorial card. Without them the sim never advances.
- **The 3x5 font has no glyph for a character it does not list**; a missing
  one draws nothing. `node tools/fits.js` checks every literal for fit and
  glyphs.
- **`drawBows()` builds the path, then strokes it.** Stroking before
  `beginPath()` draws the previous band's path in the current colour.

## Shape of the game

- 5v5 on a pitch `PW` (300) wide and 640 to 880 long, seen through a 200x264
  viewport that scrolls on both axes. World and screen are different spaces:
  `52_arena.js` onward draws inside `translate(-camX, VT - cam)`, the HUD
  outside it.
- `genArena(n)` turns one integer into name, palette, length, goal width,
  layout, hazards and night; it reads the live `div`, so higher divisions get
  more studs and hazards. Studs are placed in mirrored pairs by fraction across
  the pitch, so both ends are equal.
- Three stats, `p.s` = [STR, SPD, TKL], 0 to 8; `p.cs` is the match copy with
  any injury subtracted. Coefficients live in `70_sim.js` and are felt per
  point; retune with a scripted match, not by eye.
- Scoring in `pts()` (`79_ball.js`): 10 a goal or ambulance plus one per lit
  star; `bank[i]` is the left star on row `i`, `bank[i + 7]` the right.
- The AI is one brain, `iq = div * .25` in `76_ai.js`, sharpened by division.
- Between matches there is one screen, the desk (`depot()`): roster on the
  left, five console rows on the right dispatched by `doAct()`.
- The tutorial is one card, once, chosen by `touch`; achievements are eight
  bits in `localStorage.rb`, every access in try/catch.
