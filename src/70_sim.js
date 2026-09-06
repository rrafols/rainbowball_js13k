/* ---------- 11. simulation ---------------------------------- */
/* Three stats, cs[0] STR, cs[1] SPD, cs[2] TKL, 0-5 each. The spreads below are
   deliberately wide: a 5 runs half again as fast as a 0, launches the ball more
   than twice as hard, and wins the tackle against anything two points below. */
const spdOf = p => .85 + p.cs[1] * .19;
const accOf = p => .2 + p.cs[1] * .04;
const strOf = p => .3 + p.cs[0] * .34;
const tklOf = p => p.cs[2];

function shoot(p) {
  const b = ball;
  b.own = null; b.cd = 14; b.last = p.t;
  const v = 2.2 + p.cs[0] * .56;                           // STR is launch power
  b.vx = cos(p.ang) * v; b.vy = sin(p.ang) * v;
  b.vz = .5 + p.cs[0] * .12;                             // and it leaves the ground
  b.x = p.x + cos(p.ang) * 8; b.y = p.y + sin(p.ang) * 8;
  p.cool = 12;
  snd(320, .1, 'triangle', .05, 90);
  boom(b.x, b.y, 5, p.hue, 2);
}
/* One roll per attempt, held on .rol for as long as the dash lasts. The roll is
   0-10 against a margin of 4.5, and the width matters: at 0-6 against 2.5 a
   four-point TKL gap needed a roll of 6.5 out of 6, so it was not unlikely, it
   was impossible - and since Kevin starts on TKL 5 and division 0 opponents sit
   on 1, nobody could lay a hoof on you all season. Level is still about 55%,
   each point is worth about a tenth, and the worst mismatch keeps a 5% chance
   so there is no wall. */
function tackle(p) { p.dash = 14; p.rol = rs() * 10; p.cool = 26 - p.cs[2] * 3;
  snd(180, .06, 'sawtooth', .035); }
function knock(p, by) {
  p.down = clamp(74 - tklOf(p) * 9, 22, 80);
  const a = atan2(p.y - by.y, p.x - by.x), f = 2.4 + strOf(by) * .8;
  p.vx = cos(a) * f; p.vy = sin(a) * f;
  if (ball.own === p) { ball.own = null; ball.cd = 16; ball.vx = cos(a) * 2; ball.vy = sin(a) * 2; }
  const force = strOf(by) + hyp(by.vx, by.vy) * .5;      // how hard was that
  /* Two frozen frames, and only on the full-KO tier. At the 2.4 tier it fired
     on most tackles and chained through a scrum into a visible stutter. */
  if (force >= 3.6 && !hstop) hstop = 2;
  /* three tiers of fireworks, not four: the two lightest merged for 40 B and
     nobody could tell a 1.3 hit from a 2.3 one anyway */
  if (force < 2.4) { boom(p.x, p.y, 18, p.hue, 2.8, 1); shake = 4; }
  else if (force < 3.6) {
    boom(p.x, p.y, 40, -1, 4.2, 1); boom(p.x, p.y, 16, -1, 5, 1, 2);
    ring(p.x, p.y, -1, 44, 24); puff(p.x, p.y + 3, p.hue, 7); shake = 8;
  } else {                                              // full KO: mushroom of glitter
    p.down = 999; p.slide = 1;                          // rainbows himself home
    for (let i = 0; i < 4; i++) puff(p.x, p.y - i * 5, p.hue, 7);
    boom(p.x, p.y, 70, -1, 5.5, 1); boom(p.x, p.y, 24, -1, 6, 1, 2);
    ring(p.x, p.y, -1, 70, 32); ring(p.x, p.y, p.hue, 44, 22);
    shake = 12; say(p.name.slice(0, 14) + ' KO!');
  } snd(90, .18, 'sawtooth', .06, 40);
  drain(p, .1 + force * .05);                           // TKL soaks it up; empty = off

  if (by.t === 0) charge(14);
  if (ball.own === p || rs() < .25) say(p.name.slice(0, 14) + ' DOWN!');
}
/* Energy: every hit takes a bite out of it, tackling stat decides how big a
   bite. Run it down and the medics come out; whoever finishes a match on a
   near-empty bar picks up an injury at the whistle (see injuries()). */
function drain(p, n) {
  p.hp = clamp(p.hp - n * .75 * (1 - p.cs[2] * .07), 0, 1);   // TKL 5 soaks up a third
  if (p.hp <= 0 && !hurt) { p.down = 999; p.slide = 0; stretcher(p); }
}
/* Speedball-2 stoppage. Putting a unicorn in the ambulance is worth a point to
   the other side, however it happened - tackled, zapped or flattened by the
   ball - and the restart is a kickoff, exactly like conceding. The sim is
   frozen while the medics work, so the ball hangs where it was and the clock
   stops. `ph` counts the stoppage: the injury portrait holds for HURTCAM ticks
   before the medics get going. */
function stretcher(p) {
  const sx = tunX(p.x) + 5, sy = tunY(p.y);          // they live in the tunnel
  hurt = { p, x: sx, y: sy, tx: p.x, ty: p.y, sx, sy, ph: 0 };
  sc[1 - p.t] += pts(1 - p.t);           // an ambulance is worth a goal
  if (p.t) { money += 60; charge(20); ach(3); }
  say(p.name.slice(0, 12) + ' INJURED!');
  snd(150, .5, 'sawtooth', .06, 60);
}
function stepMedics() {
  const h = hurt, p = h.p;
  if (h.ph++ < HURTCAM) { look(p.x, p.y, .04); return; }   // hold on the casualty
  const dx = h.tx - h.x, dy = h.ty - h.y, d = hyp(dx, dy) || 1;
  if (d > 2) { h.x += dx / d * 1.15; h.y += dy / d * 1.15; }   // a steady walk, no rush
  else if (h.tx !== h.sx) {                            // reached the body, turn back
    h.tx = h.sx; h.ty = h.sy;
    say(p.name.slice(0, 12) + ' CARRIED OFF');
    snd(560, .12, 'square', .04, 300);
  } else { p.hp = .25; hurt = null; return subOn(p); }  // in through the tunnel
  if (h.tx === h.sx) { p.x = h.x; p.y = h.y - 4; }      // riding the stretcher
  look(h.x, h.y, .04);                                 // watch them work
}
/* Off one, on one - if there is anybody left to bring on. A side with nobody
   able to play loses there and then. */
function subOn(p) {
  const i = pl.indexOf(p);
  if (i >= 0) pl.splice(i, 1);
  p.off = 1;                                 // carried off: done for this match
  const nx = p.t ? foeBench.shift()
                 : squad.filter(q => fit(q) && !q.off && !pl.includes(q))[0];
  if (nx) {
    nx.t = p.t; nx.k = p.k; nx.hp = 1; nx.down = 0; nx.slide = 0;
    nx.cs = p.t ? nx.s : statsOf(nx);
    nx.ag = p.ag; nx.trail = [];
    pl.push(nx);
    say(nx.name.slice(0, 12) + ' COMES ON');
  } else if (!pl.some(q => q.t === p.t)) return endMatch(p.t ? 0 : 1);
  else say((p.t ? 'THEY ARE' : 'YOU ARE') + ' A UNICORN DOWN');
  kickoff(0);
}
function charge(n) {
  meter = clamp(meter + n, 0, 100);
  if (meter === 100) snd(880, .08, 'sine', .04, 1400);
}
