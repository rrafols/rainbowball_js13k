/* ---------- 6. squads, stats, injuries ---------------------- */
function makeUnicorn(hue, quality, bias) {
  const a = rs() * 6 | 0, A = ARCH[a], s3 = [];
  for (let i = 0; i < 3; i++)                 // STR, SPD, TKL: 0-5, and every point tells
    s3.push(clamp(Math.round(A.w[i] * 1.5 * quality * (bias ? bias[i] : 1) + rs() * 1.4), 0, 5));
  return {
    name: nameGen(), a, hue, s: s3, hp: 1, inj: null,
    /* Four independent trimmings in four bits: 1 eye patch, 2 striped horn,
       4 earring, 8 white socks. Half of them get none at all, so a plain
       unicorn stays the norm and a decorated one still reads as unusual. */
    tr: rs() < .5 ? 0 : rs() * 16 | 0,
    x: 100, y: 150, vx: 0, vy: 0, f: 1, ang: -PI / 2,
    down: 0, dash: 0, cool: 0, bcd: 0, k: 0, t: 0, trail: []
  };
}
const fit = p => !p.inj || p.inj.m <= 0;
/* Everything that draws a unicorn takes ONE number for what it looks like: the
   archetype in the low three bits, the four trimmings above them. One argument
   instead of two at six call sites, and `unicorn()` unpacks it in one line.
   Six archetypes times sixteen trims is ninety-six looks from two fields. */
const lk = p => p.a + p.tr * 8;
function newSquad() {
  squad = [];
  for (let i = 0; i < 8; i++) squad.push(makeUnicorn(TEAMS[0].h, 1));
  squad[0].name = 'KEVIN'; squad[0].s = [4, 4, 5];             // Kevin is inexplicably good
}
function statsOf(p) {                       // injuries bite here, once, per match
  const s3 = p.s.slice();
  if (p.inj && p.inj.m > 0) s3[p.inj.s] = clamp(s3[p.inj.s] - p.inj.a, 0, COST.length);
  return s3;
}
/* the last match of the season is always DEATH RAINBOWS, and they leave rails */
const boss = () => div === 3 && mIn === 2;
function foeTeam() { return boss() ? TEAMS[4] : TEAMS[1 + (div * 2 + mIn) % (TEAMS.length - 1)]; }
/* a 5/5/5 unicorn is a rainbow unicorn: its mane cycles and its rails cost half */
const mxd = q => q[0] > 4 && q[1] > 4 && q[2] > 4;
function newMatch() {
  const F = foeTeam();
  pl = [];
  const line = squad.filter(fit).concat(squad.filter(p => !fit(p))).slice(0, 5);
  squad.forEach(p => p.off = 0);              // everyone is available again
  line.forEach((p, i) => { p.t = 0; p.k = i; p.hp = 1; p.cs = statsOf(p); pl.push(p); });
  foeBench = [];
  for (let i = 0; i < 8; i++) {                 // five out, three on the bench
    const p = makeUnicorn(F.h, .8 + div * .3, F.b);
    p.t = 1; p.k = i % 5; p.cs = p.s; p.ag = F.ag; p.hp = 1;
    if (i < 5) pl.push(p); else foeBench.push(p);
  }
  sc = [0, 0]; gls = 0; clock = 90; meter = 0;
  bank = Array(14).fill(0); fx = []; bows = []; ghs = []; sweep = 0; specT = 0;
  AR = genArena(div * 3 + mIn + sd); FB = AR.len;
  GX0 = CX - AR.gw / 2; GX1 = CX + AR.gw / 2;
  STARY = AR.stars; cam = 0; pools();
  bumps = AR.bumps.map(b => ({ x: b.x, y: b.y, r: b.r, l: 0, hx: b.x, ph: rs() * 7 }));
  kickoff(1);
  /* what you are walking onto: the arena's name and whichever hazards it rolled */
  say(AR.n + [AR.zap && 'ZAP', AR.move && 'SLIDE', AR.ice && 'ICE', AR.sky && 'NO WALLS']
    .filter(h => h).map(h => ' - ' + h).join(''));
}
function kickoff(first) {
  /* Five to their slots in FORM: keeper on its own line, two backs, two
     forwards short of the centre spot. By role, not by array slot. */
  pl.forEach(p => {
    const s2 = home(p.k, p.t, FB);
    p.x = s2[0]; p.y = s2[1]; p.vx = p.vy = 0; p.down = 0; p.dash = 0; p.slide = 0;
    p.ang = p.t ? PI / 2 : -PI / 2; p.trail = []; p.bcd = 0;
  });
  bows = []; hurt = null;
  ball = { x: CX, y: FB / 2, vx: 0, vy: 0, own: null, cd: 30, last: 0, z: 0, vz: 0, ride: 0 };
  cam = clamp(FB / 2 - VH / 2, 0, FB - VH);
  camX = clamp(CX - W / 2, 0, CAMX);
  st = 'ready'; phase = first ? 100 : 60;
  say(first ? 'GET READY!' : '');
}
function injuries() {
  squad.forEach(p => {
    if (p.inj && p.inj.m > 0) p.inj.m--;
    if (!p.inj || p.inj.m <= 0)
      p.inj = p.off ? { s: rs() * 3 | 0, a: 1 + (rs() * 2 | 0), m: 1 } : null;   // out for exactly one match
  });
}
const INJT = ['SORE HORN','SORE HOOF','SORE EGO'];
function say(s) { if (s) { ban = s; banT = 90; } }
