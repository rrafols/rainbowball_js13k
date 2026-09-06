/* ---------- 3b. two tiny trackers ---------------------------
   32 steps, three voices, patterns stored as digit strings. Two tunes: the
   title and the desk get the warm pentatonic one this game started with, the
   match gets techno. The switch is by state, and it is deliberately the whole
   match - ready, play, goal, full time - because swapping tune at every
   kickoff and every goal would be seasickness.                              */
let mstep = 0, mnext = 0;
const SCALE = [0, 3, 5, 7, 10];                    // minor pentatonic
const TUNE = [
  /* menus: the bass holds four steps at a time, the lead wanders over it and
     the drums play a backbeat. Nothing hurries. */
  ['00003333555533337777555500003333',
   '0-2-4-7-4-2-0-3-5-7-5-3-2-0-4-2-',
   'K-H-S-H-K-H-S-H-K-HKS-H-K-H-S-HH'],
  /* play: the kick is not in this pattern at all - it is every fourth step in
     music() - so the bass can own the offbeats between the kicks, which is
     what makes the two lock. Hats on the other offbeat, claps on 8 and 24. */
  ['-0-0-0-5-0-0-0-3-0-0-0-5-0-0-0-7',
   '024-024-024-027-024-024-029-027-',
   '--H---H-S-H---H---H---H-S-H---H-']
];
const nf = (n, o) => 55 * Math.pow(2, o + SCALE[n % 5] / 12 + ((n / 5) | 0));
function tone(f, when, d, type, v, f2) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, when);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, when + d);
  g.gain.setValueAtTime(v, when);
  g.gain.exponentialRampToValueAtTime(.0001, when + d);
  o.connect(g); g.connect(AC.destination); o.start(when); o.stop(when + d + .02);
}
function music() {
  if (!AC || mute) return;
  const go = !'title depot promo done'.includes(st),   // in a match, or at a desk
        T = TUNE[+go], sp = go ? .105 : .135;
  if (mnext < AC.currentTime) mnext = AC.currentTime + .05;
  while (mnext < AC.currentTime + .3) {
    const i = mstep & 31, w = mnext, bar = mstep >> 5 & 3;
    /* Four bars, not one. Bar 2 lifts every voice two scale degrees; bar 3
       drops the floor out for half a bar - no kick, no bass, hats only - and
       then slams back with a roll into bar 0. That arithmetic is the whole
       difference between a loop and a track. */
    const tp = go && bar === 2 ? 2 : 0, drop = go && bar === 3 && i < 16;
    const b = T[0][i], l = T[1][i], d = T[2][i];
    if (go && !drop && i % 4 === 0) tone(150, w, .14, 'sine', .1, 38);  // four on the floor
    if (b !== '-' && !drop) go
      ? tone(nf(+b + tp, 0), w, sp * .95, 'sawtooth', .065, nf(+b + tp, 0) * .6)
      : tone(nf(+b, 0), w, sp * 1.7, 'triangle', .07);
    if (l !== '-') tone(nf(+l + tp, 2), w, sp * (go ? .75 : .9), 'square', go ? .026 : .028);
    if (go && l !== '-' && i % 4 === 2) tone(nf(+l + tp, 3), w + sp * .5, sp * .4, 'square', .015);
    if (d === 'K') tone(150, w, .12, 'sine', .09, 40);
    if (d === 'S') tone(1700, w, .07, 'square', .024, 400);
    if (d === 'H' || (go && bar === 3 && i > 27)) tone(7000, w, .02, 'square', .013);
    mnext += sp; mstep++;
  }
}
/* copper bars, the way an Amiga would have done a sky */
function copper(y0, h, hue) {
  for (let i = 0; i < h; i += 2)
    R(0, y0 + i, W, 2, C(hue + i * 7 + sin(t * .02 + i * .2) * 24, 30 + sin(i * .4) * 14, 70));
}
