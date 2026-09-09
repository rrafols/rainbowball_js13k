/* ---------- 12. drawing ------------------------------------- */
/* The ball is the one thing out here that is not a unicorn and not a rainbow,
   and it is deliberately the only cold object on the pitch: a steel sphere, the
   way Speedball's was. Three discs offset up and left make it round - each one
   lighter and further from the rim - then a white cap for the specular and a
   line of pitch colour underneath, which is the ground bouncing back into it.
   It wears the same dark rim the unicorns wear, so it holds against a pastel
   surface; before that it was the hardest thing on the pitch to follow. */
/* Built once, not per frame: a soft darkening at the edges of the viewport.
   It costs one gradient and it is most of the difference between "rectangles
   on a canvas" and something that looks lit. */
const VIG = X.createRadialGradient(100, VT + VH / 2, 58, 100, VT + VH / 2, 168);
VIG.addColorStop(0, 'rgba(20,11,42,0)');
VIG.addColorStop(1, 'rgba(20,11,42,.46)');
function vignette() { X.fillStyle = VIG; X.fillRect(0, VT, W, VH); }
/* Built once a match: a glow in each team's colour to sit under its unicorns,
   and one floodlight for the night arenas. Gradients are cheap to draw and
   dear to build, so they are built here and not per frame. */
function pools() {
  LP = [TEAMS[0].h, foeTeam().h].map(h => {
    const g = X.createRadialGradient(0, 0, 2, 0, 0, 16);
    g.addColorStop(0, C(h, 62, 90, .3)); g.addColorStop(1, C(h, 62, 90, 0)); return g;
  });
}
/* Bloom without a shader and without touching a pixel individually: shrink the
   frame to a sixteenth, multiply it by itself so only the bright survives, then
   add it back smoothed and stretched. Three drawImage calls a frame. */
const BC = document.createElement('canvas'), BX = BC.getContext('2d');
BC.width = 50; BC.height = 75; BX.imageSmoothingEnabled = 1;
function bloom() {
  BX.globalCompositeOperation = 'source-over';
  BX.clearRect(0, 0, 50, 75);
  BX.drawImage(CV, 0, 0, W, H, 0, 0, 50, 75);
  BX.globalCompositeOperation = 'multiply';
  for (let i = 3; i--;) BX.drawImage(BC, 0, 0);    // to the eighth: a pastel pitch
  X.globalCompositeOperation = 'lighter';          // is bright enough that one
  X.imageSmoothingEnabled = 1; X.globalAlpha = .3; // squaring left it blown out
  X.drawImage(BC, 0, 0, 50, 75, 0, 0, W, H);
  X.globalAlpha = 1; X.imageSmoothingEnabled = 0;
  X.globalCompositeOperation = 'source-over';
}
function drawBall() {
  const b = ball, r = 3, by = b.y - b.z;               // drawn up by its height
  X.fillStyle = C(0, 10, 0, Math.max(.06, .25 - b.z * .012));   // shadow stays on the ground
  X.beginPath(); X.ellipse(b.x, b.y + 4, r + 1 + b.z * .06, 1.6, 0, 0, 7); X.fill();
  if (AR.ice) { X.fillStyle = C(232, 50, 14, .22);      // and the ice shows it back
    X.beginPath(); X.arc(b.x, b.y + 9 + b.z, r, 0, 7); X.fill(); }
  X.fillStyle = '#2a143a';
  X.beginPath(); X.arc(b.x, by, r + 1, 0, 7); X.fill();
  for (let i = 0; i < 3; i++) {
    X.fillStyle = C(232, 44 + i * 13, 17 - i * 4);
    X.beginPath(); X.arc(b.x - i * .5, by - i * .6, r - i * .9, 0, 7); X.fill();
  }
  R(b.x - 1, by - r, 2, 1, 'rgba(255,255,255,.75)');        // specular
  if (!b.z) R(b.x - 1, by + r - 1, 2, 1, C(AR.f, 54, 44, .45));   // bounce off the pitch
  ghs.forEach(g => { X.fillStyle = C(t * 9 + g.life * 5, 62, 90, .6);  // prism ghosts
    X.beginPath(); X.arc(g.x, g.y, 2.5, 0, 7); X.fill(); });
}
function drawPlayers() {
  pl.slice().sort((a, b) => a.y - b.y).forEach(p => {
    p.trail.forEach((q, i) => {
      X.fillStyle = C(p.hue + i * 34, 62, 95, 1 - i / 10);
      X.fillRect(q[0] - 3, q[1] - 1, 6, 2);
    });
    /* A disc at the feet, red for them and blue for you. Team hue alone was not
       enough: it dresses the whole unicorn, so two pastel teams read as one
       crowd at thirteen pixels a player. The old shadow ellipse does double duty
       as the disc's rim, which keeps it legible on a pale pitch. */
    X.fillStyle = 'rgba(20,11,42,.45)';
    X.beginPath(); X.ellipse(p.x, p.y + 7, 7, 2.9, 0, 0, 7); X.fill();
    X.fillStyle = p.t ? C(2, 52, 94) : C(214, 56, 94);
    X.beginPath(); X.ellipse(p.x, p.y + 7, 5.4, 2, 0, 0, 7); X.fill();
    if (p === hero && !p.down) star(p.x, p.y - 12, 3.4, C(50, 68), t * .05);
    if (p.dash > 0) boom(p.x, p.y + 4, 2, p.hue, 1.6);
    if (!p.down && hyp(p.vx, p.vy) > 1.3 && t % 8 === 0) puff(p.x, p.y + 6, 40, 1);   // dust: was > 1.1 every 5 ticks
    if (p.hp < 1 && !p.slide) {                 // energy, shown once it has been dented
      R(p.x - 6, p.y - 11, 12, 2, '#3a1030');
      R(p.x - 6, p.y - 11, 12 * p.hp, 2, C(p.hp * 40, 58));
    }
    X.save(); X.translate(p.x | 0, p.y | 0); X.globalCompositeOperation = 'lighter';
    X.fillStyle = LP[p.t]; X.fillRect(-16, -16, 32, 32); X.restore();   // team-coloured glow
    unicorn(p.x, p.y, p.hue, p.cs, p.f, t * .35 + p.x, p.down ? Math.min(p.down, 6) : 0, lk(p) + (p.dash > 0 ? 128 : 0));
    const x0 = (p.x | 0) - 12, y0 = (p.y | 0) - 12;       // OC still holds this sprite
    if (AR.ice) {                                          // an icy pitch reflects
      X.save(); X.globalAlpha = .28; X.translate(0, 2 * ((p.y | 0) + 9)); X.scale(1, -1);
      X.drawImage(OC, x0, y0); X.restore();
    }
  });
}
/* the stretcher party: two unicorns in red, a white stretcher slung between */
function medics() {
  const h = hurt;
  if (!h) return;
  const d = h.tx > h.x ? 1 : -1, ph = t * .35;
  X.fillStyle = 'rgba(40,20,60,.22)';
  X.beginPath(); X.ellipse(h.x, h.y + 7, 17, 3, 0, 0, 7); X.fill();
  R(h.x - 11, h.y + 1, 22, 2, '#fff');
  unicorn(h.x - 11 * d, h.y, 0, MED, d, ph, 0, 1);       // medics are bruisers
  unicorn(h.x + 11 * d, h.y, 0, MED, d, ph + 2, 0, 1);
}
/* Speedball-2 cut-in. The goal camera and the injury replay are the same panel:
   `e` is how long it has been up, `ko` swaps the shouting face for a sorry one
   with stars going round its head. */
function camPanel(p, e, ko, left = 99) {
  const s = 4 + e * .01, y0 = 82, hh = 122,
        k = clamp(Math.min(e, left) / 7, 0, 1),      // wipes open, holds, wipes shut
        oy = y0 + hh / 2 - hh * k / 2, oh = hh * k;
  R(6, oy, 188, oh, 'rgba(20,11,42,.93)');
  X.save();
  X.beginPath(); X.rect(8, oy + 2, 184, Math.max(0, oh - 4)); X.clip();
  R(8, y0 + 2, 184, hh - 4, C(p.hue, 16, 60));
  for (let i = 0; i < 7; i++) {                      // spotlights behind the head
    const a = t * .01 + i * .9;
    X.fillStyle = C(p.hue + i * 40, 28 + i * 3, 70, .22);
    X.beginPath(); X.moveTo(100, y0 + 62);
    X.lineTo(100 + cos(a) * 200, y0 + 62 + sin(a) * 200);
    X.lineTo(100 + cos(a + .3) * 200, y0 + 62 + sin(a + .3) * 200);
    X.fill();
  }
  bigUnicorn(100, y0 + 62, s, p.hue, p.cs || p.s, 1, lk(p), ko ? 3 : 0);   // the sprite, blown up; on its side when KO
  if (ko) for (let i = 0; i < 3; i++) {              // seeing stars
    const a = t * .07 + i * 2.1;
    star(100 + cos(a) * 30, y0 + 30 + sin(a) * 8, 3.4, C(50, 70), t * .1);
  }
  for (let y = y0 + 2; y < y0 + hh; y += 4) R(8, y, 184, 1, 'rgba(20,11,42,.22)');
  X.restore();
  /* the frame wipes with the interior - now that the panel closes as well as
     opens, a full-size frame round a shrinking picture read as an empty box */
  for (let i = 0; i < 3; i++) {                     // frame flashes through the rainbow
    X.strokeStyle = C(t * 9 + i * 70, 62); X.lineWidth = 1;
    X.strokeRect(6.5 + i, oy + .5 + i, 187 - i * 2, Math.max(0, oh - 1 - i * 2));
  }
  if (k < 1) return;                                 // titles land once it has opened
  R(8, y0 + hh - 21, 184, 19, 'rgba(20,11,42,.6)');  // keep the caption readable
  txt(ban, 100, y0 + 8, 0, 2, 1, t * 4);
  txt(p.name.slice(0, 14), 100, y0 + hh - 18, '#fff', 1, 1);
  txt(sc[0] + ' - ' + sc[1], 100, y0 + hh - 9, C(50, 66), 1, 1);
}
function goalCam() { if (scorer) camPanel(scorer, GOALT - phase, 0, phase); }
function drawFx() {
  fx.forEach(q => {
    const k = clamp(1 - q.life / q.max, 0, 1), c = C(q.h, 62 + k * 20, 100, k);
    if (q.ty === 3) {
      X.strokeStyle = C(q.h + q.life * 7, 62, 100, k * .9);
      X.lineWidth = 1 + k * 1.6; X.beginPath();
      X.arc(q.x, q.y, q.r0 + (q.r1 - q.r0) * (1 - k), 0, 7); X.stroke(); return;
    }
    if (q.ty === 4) { cloud(q.x, q.y, 2 + (1 - k) * 5, C(q.h, 90, 55, k * .45)); return; }
    star(q.x, q.y, .8 + k * 2.6, c, q.r);
  });
  if (sweep > 0) {                                   // rainbow sweeps the pitch
    const y = cam + VH - (60 - sweep) * (VH / 60);
    for (let i = 0; i < 7; i++) R(FL, y + i * 3, FR - FL, 3, C(t * 3 + i * 45, 62, 95, .55));
    sweep--;
  }
}
function hud() {
  const foe = foeTeam();
  R(0, 0, W, VT, '#140b2a');
  txt(TEAMS[0].n, 4, 4, C(TEAMS[0].h, 68), 1);
  txt(foe.n, W - 4, 4, C(foe.h, 68), 1, 2);
  /* the star multiplier beside each score - X1.3 for three stars lit - in the
     team's disc colour, and only once there is one */
  const w0 = txt(sc[0], 4, 12, '#fff', 1), n0 = pts(0) - 10, n1 = pts(1) - 10;
  if (n0) txt('X' + (10 + n0) / 10, 8 + w0, 12, C(214, 62, 94), 1);   // up to X2.4 with all fourteen
  const w1 = txt(sc[1], W - 4, 12, '#fff', 1, 2);
  if (n1) txt('X' + (10 + n1) / 10, W - 8 - w1, 12, C(2, 58, 94), 1, 2);
  txt(('0' + Math.max(0, Math.ceil(clock))).slice(-2), 100, 6, '#fff', 2, 1);

  R(0, VB, W, H - VB, '#140b2a');
  const bw = W - 24;
  R(6, VB + 3, bw, 6, '#291b48');
  for (let i = 0; i < bw - 2; i++) if (i / (bw - 2) < meter / 100)
    R(7 + i, VB + 4, 1, 4, C(i * 2 + t * 2, 60));
  for (let i = 1; i < 4; i++) R(6 + bw * i / 4, VB + 3, 1, 6, '#140b2a');
  audioIcons(W - 13, VB + 2);
  // touch pads
  /* touch pads: a RAIL ring and a HIT ring down the right edge (any tap on
     the right half hits; the ring is a target, not a requirement), and the
     stick's base ring wherever the left thumb landed */
  if (touch) {
    X.strokeStyle = 'rgba(255,255,255,.28)'; X.lineWidth = 1;
    for (const [y, l] of [[196, 'RAIL'], [240, 'HIT']]) {
      X.beginPath(); X.arc(172, y, 18, 0, 7); X.stroke();
      txt(l, 172, y - 3, 'rgba(255,255,255,.5)', 1, 1);
    }
    if (jid >= 0) {
      X.beginPath(); X.arc(jox, joy, 14, 0, 7); X.stroke();
      X.fillStyle = 'rgba(255,255,255,.3)';
      X.beginPath(); X.arc(jox + jx * 10, joy + jy * 10, 6, 0, 7); X.fill();
    }
  }
}
/* The audio icon: one speaker, on or off. M toggles everything - effects and
   music together - so there is one state to show. Gold with sound waves when
   on, grey and struck through when muted. */
function audioIcons(x, y) {
  const c = mute ? '#6a5a94' : C(50, 66);
  R(x, y + 2, 2, 3, c); R(x + 2, y + 1, 1, 5, c); R(x + 3, y, 1, 7, c);   // speaker
  if (mute) R(x - 1, y + 3, 9, 1, C(0, 55)); else R(x + 5, y + 2, 1, 3, c);
}
function banner() {
  if (banT <= 0) return;
  banT--;
  const y = 130, s = 2;
  txt(ban, 101, y + 1, '#20103a', s, 1);
  txt(ban, 100, y, 0, s, 1, t * 5);
}
function bigUnicorn(x, y, s, hue, q, f, a, d = 0) {
  X.save(); X.translate(x, y); X.scale(s, s);
  unicorn(0, 0, hue, q, f, t * .18, d, a); X.restore();
}
