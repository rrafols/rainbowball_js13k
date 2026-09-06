/* Renders the README screenshots: boots the packed artifact under node-canvas,
   plays a match and captures title, open play, a goal and every menu screen to
   screenshots/ at 3x nearest-neighbour. Build with --test first, same as
   tools/smoke.js:
     node tools/build.js --test --roadroller && node tools/shots.js            */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas';
const cv = createCanvas(200, 300);
global.document = { getElementById: () => cv, querySelector: () => cv,
  createElement: () => createCanvas(24, 24) };   // the sprite bakes into an offscreen
global.window = {}; global.addEventListener = () => {}; global.requestAnimationFrame = () => {};
global.performance = { now: () => 0 };
cv.addEventListener = () => {}; cv.setPointerCapture = () => {}; cv.style = {};
cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 300 });
const html = readFileSync('dist/index.html', 'utf8');
const code = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
(0, eval)(code);
const g = globalThis.__g;
if (!g) { console.error('  build was not made with --test'); process.exit(1); }
g.skipT = 1; g.lit = 1;                          // shoot the game, not the tutorial cards

const SCALE = 3;
mkdirSync('screenshots', { recursive: true });
const shot = name => {
  g.render();
  const out = createCanvas(200 * SCALE, 300 * SCALE), x = out.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(cv, 0, 0, 200 * SCALE, 300 * SCALE);
  writeFileSync('screenshots/' + name + '.png', out.toBuffer('image/png'));
  console.log('  screenshots/' + name + '.png');
};
const play = n => { for (let i = 0; i < n; i++) { g.tick(); g.render(); } };
const until = (f, n = 6000) => { for (let i = 0; i < n && !f(); i++) { g.tick(); g.render(); } };

play(14);                                     // let the curtain drop off the title
shot('title');
g.menu();                                     // title -> kick off
play(900);                                    // open play: ball loose, hazards up
shot('match');
until(() => g.st === 'goal');                 // the celebration, rail still drawn
play(62);                                     // the panel holds off 26 ticks, then wipes open over 7
shot('goal');
until(() => g.st === 'over', 14000);
/* Menus now fade up over eight frames, so a shot of the first frame of a
   screen is a black rectangle. Let each one arrive before capturing it. */
g.menu(); if (g.st === 'promo') { play(12); shot('promotion'); g.menu(); }
play(52);            // the plates stagger in over about forty frames
shot('squad');                                // the management desk, the only menu now
