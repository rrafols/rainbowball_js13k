/* Renders a trailer: title cards in the game's own font cut against scenes the
   bot stages (kick off, a goal, an ambulance, rails, full spectrum, the desk,
   DEATH RAINBOWS), the music running through, 800x1200 at 60 fps. Same setup
   as video.js.
     node tools/build.js --test --roadroller && node tools/trailer.js [out.mp4] */
import { mkdirSync } from 'fs';
import { boot, Rec, FPS } from './clip.js';
import { bot, setup } from './bot.js';
const OUT = process.argv[2] || 'promo/trailer.mp4';
const { g, cv, X, audio, key, release } = await boot(200, 300, 90);
const B = bot(g, key, release), W = 200, H = 300;
mkdirSync('promo', { recursive: true });
const R = new Rec(cv, OUT, 4, audio);
const C = (h, l = 60, s = 80, a = 1) => `hsla(${h | 0},${s}%,${l}%,${a})`;
const black = a => { X.fillStyle = `rgba(20,11,42,${a})`; X.fillRect(0, 0, W, H); };
const ramp = (f, n, up, down) => Math.min(1, f / up, (n - 1 - f) / down);
const shadow = (s, x, y, c, sc, rb = -1) => { g.txt(s, x + 1, y + 1, 'rgba(0,0,0,.7)', sc, 1); g.txt(s, x, y, c, sc, 1, rb); };
let vol = 1;
async function card(lines, n = 110, sc = 2) {
  for (let f = 0; f < n; f++) {
    g.music(); black(1);
    const a = ramp(f, n, 16, 16), y0 = H / 2 - lines.length * 8 * sc / 2;
    lines.forEach((s, i) => shadow(s, W / 2, y0 + i * 8 * sc, C(0, 96, 0, a), sc));
    black(1 - a);
    await R.frame(vol);
  }
}
/* a scene: n ticks of the bot, or until stop() says so (then tail frames more), a caption at the bottom of the pitch */
async function play(n, cap = '', stop = 0, tail = 0) {
  let left = -1;
  for (let f = 0; f < n && left != 0; f++) {
    g.music(); B(); g.tick(); g.render();
    if (left < 0 && stop && stop()) left = tail; else if (left > 0) left--;
    const out = left >= 0 ? Math.min(1, left / 16) : 1, a = Math.min(ramp(f, n, 10, 16), out);
    if (cap) { X.fillStyle = `rgba(20,11,42,${.6 * a})`; X.fillRect(0, H - 40, W, 14); shadow(cap, W / 2, H - 38, C(0, 96, 0, a), 1); }
    black(1 - Math.min(ramp(f, n, 8, 16), out));
    await R.frame(vol);
  }
}
/* silence between scenes: play on without a frame or a note, until a condition or a cap */
const warm = (n, until = () => 1) => { g.mute = 1; for (let i = 0; i < n; i++) { B(); g.tick(); if (until()) break; } g.mute = 0; };
/* ---- the cut ---- */
g.lit = 1; g.skipT = 1;
for (let f = 0; f < 30; f++) { g.music(); black(1); await R.frame(); }
await card(['FIVE A SIDE.']);
await card(['A STEEL BALL.']);
await card(['NO REFEREE.'], 120);
setup(g, { div: 0, mIn: 0, sd: 3, stat: 4 });                                        // the first match of the season: the countdown, and play
await play(420, 'KICK OFF.');
await card(['A GOAL IS TEN.']);
warm(6000, () => g.ball.own === g.hero && g.hero.y < 150);                          // the hero on the ball, closing on the goal
await play(600, '', () => g.st === 'goal', 150);                                     // the goal camera
await card(['AN AMBULANCE', 'IS TEN.']);
setup(g, { div: 3, mIn: 0, sd: 0, stat: 6 }); warm(200);
warm(6000, () => g.hurt);                                                            // somebody goes down
await play(420, 'THE STRETCHER.', 0, 0);
await card(['PRESS R.', 'RAILS BELONG TO NOBODY.'], 120);
setup(g, { div: 2, mIn: 1, sd: 14, stat: 5 }); warm(300);
warm(6000, () => g.bows.length);
await play(420, 'A RAINBOW THE BALL RIDES.');
await card(['FOURTEEN STARS.', 'LIGHT ALL SEVEN ON A SIDE.'], 120);
for (let i = 0; i < 6; i++) g.bank[i] = 1;                                           // six of the seven left stars are ours
warm(9000, () => g.specT);
await play(420, 'FULL SPECTRUM.');
await card(['FOUR DIVISIONS.', 'ONE DESK.'], 110);
g.st = 'depot'; g.mi = 4; g.sel = 0; warm(1);
await play(240, 'WHO IS FIT. WHO IS CARRIED OFF.');
await card(['THE LAST MATCH', 'IS ALWAYS', 'DEATH RAINBOWS.'], 130);
setup(g, { div: 3, mIn: 2, sd: 1, stat: 4 }); warm(1500);
await play(540, '', 0, 0);
/* the end card: the name over the copper, two unicorns, and where to play */
g.st = 'title';
const n = 360;
for (let f = 0; f < n; f++) {
  g.music(); black(1);
  const a = ramp(f, n, 20, 40); vol = f > n - 90 ? (n - f) / 90 : 1;
  X.globalAlpha = a;
  for (let i = 0; i < 7; i++) { X.fillStyle = C(i * 51, 60, 90, .35); X.fillRect(0, 96 + i * 4, W, 4); }
  shadow('RAINBOWBALL', W / 2, 40, 0, 3, f * 3);
  shadow('2', W / 2, 62, 0, 3, f * 3 + 60);
  g.txt('BRUTAL UNICORNS', W / 2, 90, C(300, 70), 1, 1);
  g.bigUnicorn(70, 160, 3, 50, [5, 5, 5], 1, 2); g.bigUnicorn(130, 160, 3, 265, [5, 4, 5], -1, 9);
  if (f > 50) { const b = Math.min(1, (f - 50) / 20); X.globalAlpha = a * b; g.txt('A JS13K 2026 GAME', W / 2, 214, C(0, 92, 0), 1, 1); g.txt('13 KB. NO ASSETS.', W / 2, 226, C(0, 70, 0), 1, 1); g.txt('EVERY UNICORN. EVERY ARENA.', W / 2, 236, C(0, 70, 0), 1, 1); g.txt('EVERY TUNE. ALL FROM CODE.', W / 2, 246, C(0, 70, 0), 1, 1); }
  if (f > 110) { const b = Math.min(1, (f - 110) / 20); X.globalAlpha = a * b; g.txt('PLAY IT AT JS13KGAMES.COM', W / 2, 270, C(50, 62), 1, 1); }
  X.globalAlpha = 1;
  await R.frame(vol);
}
console.log('  trailer done:', R.n / FPS | 0, 's');
await R.finish();
