/* Headless smoke test: boots dist/index.html in node-canvas, plays a full
   match with a scripted player, walks every menu screen, fails loudly. */
import { readFileSync } from 'fs';
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
g.skipT = 1; g.lit = 1;      // no gesture in node: light it by hand                                  // the tutorial is not under test here
let fails = 0;
const ck = (n, c) => { console.log((c ? '  ok   ' : '  FAIL ') + n); if (!c) fails++; };
ck('boots to title', g.st === 'title');
g.menu();
ck('match starts', g.st === 'ready' || g.st === 'play');
ck('arena generated', !!g.AR.n && g.AR.len >= 460);
ck('squad of eight', g.squad.length === 8);
for (let i = 0; i < 14000 && 'play ready goal'.includes(g.st); i++) { g.tick(); g.render(); }
ck('match reaches full time', g.st === 'over');
g.menu();                                     // full time -> the desk (or promotion)
if (g.st === 'promo') { g.render(); g.menu(); }
ck('full time lands on the management desk', g.st === 'depot');
ck('cursor starts on KICK OFF', g.mi === 4);
g.render();

// the roster column: numbers pick, arrows move and wrap
g.nav('arrowleft');                           // into the roster
g.nav('1'); const picked1 = g.sel === 0;
g.nav('arrowdown'); const moved = g.sel === 1;
g.nav('arrowup'); g.nav('arrowup');
ck('roster cursor picks, moves and wraps',
   picked1 && moved && g.sel === g.squad.length - 1);

// the console column: five rows, wrapping
g.nav('arrowright');
g.mi = 0; g.nav('arrowup');
ck('console column wraps over five rows', g.mi === 4);

// training spends stars on the selected unicorn (purse set, so the test does
// not depend on how the scripted player got on)
g.nav('arrowleft'); g.nav('1'); g.nav('arrowright');
const k = g.squad[0].s.findIndex(v => v < 5);
g.money = 5000;
const before = g.squad[0].s[k];
g.buy(k);
ck('training buys a point and charges for it',
   k >= 0 && g.squad[0].s[k] === before + 1 && g.money < 5000);

// subbing: promote the fourth unicorn into the starting three
const sub = g.squad[6];
g.nav('arrowleft'); g.nav('7'); const picked = g.sel === 6;
g.subIn();
ck('a sub can be moved into the starting five', picked && g.squad[0] === sub && g.sel === 0);
g.render();

g.doAct(4);                                   // KICK OFF
ck('second match starts', g.st === 'ready' || g.st === 'play');
console.log(fails ? '\n  ' + fails + ' FAILURES\n' : '\n  all checks passed\n');
process.exit(fails ? 1 : 0);
