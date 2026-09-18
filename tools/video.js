/* Renders a gameplay clip for social media: boots the packed --test build
   under node-canvas, sets up a match with a trained squad, plays the first
   stretch in silence and records the rest at 60 fps, 4x nearest-neighbour
   (800x1200), with the game's own music (see clip.js).
     node tools/build.js --test --roadroller && node tools/video.js [out.mp4]
   Knobs: DIV (0..3, 3), MIN (match in the division 0..2, 2: the last one is
   DEATH RAINBOWS), SD (arena seed, 1), STAT (the starters' stats, 4), SKIP
   (silent warm-up ticks, 2400), SEC (clip length, 45), PROBE=1 prints the
   arena and the score after the warm-up and stops.                        */
import { mkdirSync } from 'fs';
import { boot, Rec, FPS } from './clip.js';
import { bot, setup } from './bot.js';
const OUT = process.argv[2] || 'promo/gameplay.mp4', SEC = +process.env.SEC || 45, SKIP = +process.env.SKIP || 2400;
const { g, cv, audio, key, release } = await boot(200, 300, SEC);
const B = bot(g, key, release);
setup(g, { div: process.env.DIV ? +process.env.DIV : 3, mIn: process.env.MIN ? +process.env.MIN : 2, sd: process.env.SD ? +process.env.SD : 1, stat: +process.env.STAT || 4 });
for (let i = 0; i < SKIP; i++) { B(); g.tick(); }
console.log('  warm-up done: score', g.sc.join('-'), 'clock', g.clock | 0, 'st', g.st);
if (process.env.PROBE) process.exit(0);
mkdirSync('promo', { recursive: true });
const R = new Rec(cv, OUT, 4, audio);
let over = 0;
for (let f = 0; f < SEC * FPS; f++) {
  g.music(); B(); g.tick(); g.render();
  await R.frame();
  if (f % 600 == 0) console.log('  ' + (f / FPS | 0) + 's: score', g.sc.join('-'), 'clock', g.clock | 0, 'st', g.st);
  if (g.st === 'over' && ++over > 240) break;                              // full time: four seconds of the result, then cut
}
console.log('  video done: score', g.sc.join('-'), 'clock', g.clock | 0, 'st', g.st);
await R.finish();
