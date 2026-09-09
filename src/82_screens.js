/* ---------- 13. screens ------------------------------------- */
/* A browser will not create an AudioContext until the player has touched
   something, so the game is silent on arrival however loud it means to be. One
   press is all it takes, and this screen exists to ask for it: the title draws
   underneath, dimmed, so the first thing seen is still the game. */
function boot() {
  title();
  X.fillStyle = 'rgba(10,5,24,.72)'; X.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) R(0, 150 + i * 3, W, 3, C(i * 51 + t * 2, 60, 90, .5));
  txt('TAP OR PRESS A KEY', 100, 158, 0, 2, 1, t * 4);
}
function title() {
  R(0, 0, W, H, '#140b2a');
  copper(96, 26, t * 1.5);
  txt('RAINBOWBALL', 101, 41, '#000', 3, 1);
  txt('RAINBOWBALL', 100, 40, 0, 3, 1, t * 3);
  txt('2', 100, 62, 0, 3, 1, t * 3 + 60);
  bigUnicorn(70, 140, 3, TEAMS[0].h, [5, 5, 5], 1, 2);
  bigUnicorn(130, 140, 3, 265, [5, 4, 5], -1, 9);   // a bruiser, one eye
  let n = 0;
  for (let i = 0; i < 8; i++) n += achG >> i & 1;
  txt('ACHIEVEMENTS  ' + n + '/8', 100, 216, C(50, 62), 1, 1);
  ACH.forEach((a, i) => {                         // earned ones read, the rest are ?
    const got = achG >> i & 1;
    txt(got ? a : '?', 14 + (i & 1) * 92, 228 + (i >> 1) * 10,
        got ? C(i * 44 + 20, 66) : '#4a3a78', 1);
  });
  if (t % 60 < 40) txt('SPACE OR TAP', 100, 272, C(50, 65), 1, 1);
  audioIcons(8, 291); txt('SOUND', 22, 292, '#5b4b8a', 1);
}
/* five pips, coloured by which stat, lit up to n - the desk and the stat bars
   both draw these */
const pips = (x, y, n, i, w, h, g) => {
  /* five pips; past five they turn gold from the left, so a 7 reads as five lit with two gold */
  for (let k = 0; k < 5; k++) R(x + k * g, y, w, h, k < n - 5 ? '#ffd52a' : k < n ? C(i * 70 + 20, 60) : '#3a2a60');
};
function bars(p, x, y, w) {                      // three stats, three little bars
  const s3 = statsOf(p);
  for (let i = 0; i < 3; i++) {
    const yy = y + i * 7;
    txt(STN[i], x, yy, '#8f7fc0', 1);
    R(x + 14, yy, w, 5, '#2a1a4a');
    pips(x + 15, yy + 1, s3[i], i, w / 5 - 2, 3, w / 5);
    txt(s3[i], x + w + 17, yy, '#9f8fd0', 1);
    if (p.inj && p.inj.m > 0 && p.inj.s === i) txt('-' + p.inj.a, x + w + 21, yy, C(0, 62), 1);
  }
}
function cur(x, y, w, h) {                       // where the arrow keys are
  X.strokeStyle = C(t * 6, 70); X.lineWidth = 1;
  X.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}
function ach(i) {                                  // unlock, announce, remember
  if (achG >> i & 1) return;
  achG |= 1 << i; achT = 150; achI = i;
  try { localStorage.rb = achG; } catch (e) { }
  snd(700, .1, 'square', .05, 1500); snd(1100, .18, 'square', .04, 1900);
}
/* One card for both the tutorial and the achievements: a plate, a rainbow
   headline, lines under it. The tutorial dims the world first and holds it;
   the achievement slides in over whatever is there and slides out again. */
function card(y, h, head, L, hue) {
  plate(8, y, 184, h, 1, hue);
  txt(head, 100, y + 8, 0, 2, 1, t * 3);
  L.forEach((n, i) => txt(n, 100, y + 26 + i * 10, '#9f8fd0', 1, 1));
}
function achCard() {
  if (achT <= 0 || tipI >= 0) return;               // never over the tutorial card
  achT--;
  card(-44 + 50 * Math.min(1, achT / 14, (150 - achT) / 14), 40, ACH[achI], ['UNLOCKED'], t * 3);
}
function tipCard() {                              // the tutorial card, over everything
  const L = TUTS[tipI], h = L.length * 10 + 34, y = 150 - h / 2;
  X.fillStyle = 'rgba(20,11,42,.86)'; X.fillRect(0, 0, W, H);
  card(y, h, L[0], L.slice(1), t * 6);
  if (t % 60 < 40) txt('SPACE OR TAP', 100, y + h - 12, C(50, 66), 1, 1);
}
/* Every panel on the management screen is a pressed metal plate: a lit top and
   left edge, a shadowed bottom and right, a rivet in each corner. It is the
   cheapest way to say Speedball 2 without storing a single pixel. */
function plate(x, y, w, h, on, hue) {
  R(x, y, w, h, on ? '#33215c' : '#1d1236');
  R(x, y, w, 1, on ? C(hue + t * 2, 72, 60) : '#4a3a72');
  R(x, y, 1, h, on ? C(hue + t * 2, 64, 55) : '#3f3163');
  R(x, y + h - 1, w, 1, '#120a22'); R(x + w - 1, y, 1, h, '#120a22');
  for (let i = 0; i < 4; i++)
    R(x + (i & 1 ? w - 3 : 2), y + (i & 2 ? h - 3 : 2), 1, 1, '#6a5a94');
}
/* The desk. One screen between matches: who you have, what is wrong with them,
   what the next point costs and the button that starts the next game. Two
   columns - `dcol` 0 is the roster, 1 is the console under it - one cursor. */
function depot() {
  R(0, 0, W, H, '#140b2a');
  /* The desk assembles itself: every plate slides in from its own side, later
     the further down the screen it sits. Eight frames, and the screen stops
     feeling like it was switched on and starts feeling like it arrived. */
  plate(4, 4, 192, 26, 1, t * .6);
  txt('MANAGEMENT', 101, 9, '#0d0620', 2, 1);
  txt('MANAGEMENT', 100, 8, 0, 2, 1, t * 3);
  txt(DIVS[div] + ' ' + (mIn + 1) + '/3', 9, 22, '#9f8fd0', 1);
  txt(money + ' STARS', 191, 22, C(50, 66), 1, 2);
  squad.forEach((q, i) => {
    const y = 32 + i * 15, ill = q.inj && q.inj.m > 0, on = i === sel;
    plate(4, y, 92, 14, on, q.hue);
    if (on && !dcol) cur(4, y, 92, 14);
    txt((i + 1) + ' ' + q.name.slice(0, 12), 8, y + 2, on ? '#fff' : '#9f8fd0', 1);
    txt(ill ? 'INJ' : i < 5 ? 'ON' : 'SUB', 8, y + 8,
        ill ? C(0, 62) : i < 5 ? C(120, 60) : '#6a5a94', 1);
    bigUnicorn(86, y + 8, 1, q.hue, q.s, 1, lk(q));
  });
  const p = squad[sel];
  if (!p) return;
  const ill = p.inj && p.inj.m > 0, s3 = statsOf(p);
  plate(100, 32, 96, 120, 1, p.hue);
  txt(p.name.slice(0, 14), 148, 37, '#fff', 1, 1);
  txt(ARCH[p.a].n, 148, 46, C(p.hue, 66), 1, 1);
  bigUnicorn(148, 76, 2, p.hue, p.s, 1, lk(p));
  bars(p, 104, 94, 44);
  txt(ill ? INJT[p.inj.s] : 'FIT', 148, 122, ill ? C(0, 62) : C(120, 60), 1, 1);
  for (let i = 0; i < 5; i++) {                  // the console: five rows, one cursor
    const y = 158 + i * 20, lv = i < 3 ? p.s[i] : 0,
          cost = i < 3 ? COST[lv] : 0,
          done = i < 3 ? lv >= COST.length : i === 3 ? sel < 5 : 0,
          can = i === 4 || (!done && money >= cost),
          on = dcol && mi === i;
    plate(4, y, 192, 18, on, i * 60);
    if (on) cur(4, y, 192, 18);
    /* KICK OFF is the only double-height label, so it needs its own baseline:
       ten pixels of glyph in an eighteen pixel row centres at y+4, not y+6,
       and at y+6 it sat on the plate's bottom bevel. */
    txt(i < 3 ? 'TRAIN ' + STN[i]
              : ['SUB IN', 'KICK OFF'][i - 3],
        10, y + (i === 4 ? 4 : 6),
        can ? '#fff' : '#6a5a94', i === 4 ? 2 : 1);
    if (i < 3) pips(104, y + 6, lv, i, 5, 5, 7);
    txt(i === 4 ? 'PLAY' : done ? (i < 3 ? 'MAXED' : 'STARTING') : cost,
        190, y + 6, done ? C(120, 60) : can ? C(50, 64) : '#6a5a94', 1, 2);
  }
}
/* One screen for full time, promotion and the end of the season: headline,
   lines, the unicorn, fireworks, a prompt. `dim` draws it over the pitch. */
function results(head, hs, L, dim) {
  if (dim) { X.fillStyle = 'rgba(20,11,42,.82)'; X.fillRect(0, 0, W, H); }
  else R(0, 0, W, H, '#140b2a');
  txt(head, 100, 66, 0, hs, 1, t * 3);
  L.forEach((n, i) => txt(n, 100, 104 + i * 13 + (i ? 8 : 0), i ? '#9f8fd0' : '#fff', i ? 1 : 2, 1));
  if (!dim) bigUnicorn(100, 196, 4, TEAMS[0].h, squad[0] ? squad[0].s : [0,0,0], 1, squad[0] ? lk(squad[0]) : 0);
  boom(100 + sin(t * .1) * 50, 150, 1, -1, 2);
  if (t % 60 < 40) txt('SPACE OR TAP', 100, 254, C(t * 4, 66), 1, 1);
}
function promo() {
  results(pup ? 'PROMOTED' : 'STAYING PUT', 3,
    [DIVS[clamp(div, 0, 3)] + ' LEAGUE', pup ? '' : 'TWO WINS NEEDED']);
}
function done() {
  results('SEASON OVER', 2, ['WINS ' + wins + ' OF 12',
    wins >= 9 ? 'CHAMPIONS' : wins >= 5 ? 'RESPECTABLE' : 'TRY AGAIN']);
}
