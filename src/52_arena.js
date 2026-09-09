/* ---------- 9. arena, drawn entirely from numbers ------------ */
function cloud(x, y, r, c) {
  X.fillStyle = c; X.beginPath();
  X.arc(x - r * .7, y + r * .25, r * .6, 0, 7);
  X.arc(x, y - r * .3, r * .8, 0, 7);
  X.arc(x + r * .7, y + r * .25, r * .6, 0, 7);
  X.fill();
}
/* Four kinds of stud, picked per arena by A.bp. All of them get the same soft
   shadow first so they sit on the surface rather than float over it. */
function bumper(b, A) {
  /* two kinds of stud, not four: cupcake and moon rock went for 60 B, and
     A.bp is one bit: crystal on the odd arenas */
  const r = b.r * (1 + sin(t * .06 + b.x) * .06);
  cloud(b.x, b.y + 4, r, C(A.f, 40, 40, .4));
  if (A.bp & 1) {                                       // crystal
    star(b.x, b.y, r * 1.15, C(A.b + 150, 84, 66), t * .01);
    star(b.x, b.y, r * .62, '#fff', -t * .014);
  } else {                                              // cloud
    cloud(b.x, b.y + 1, r, '#fff');
    cloud(b.x, b.y + 3, r * .82, C(A.f + 30, 86, 60));
    cloud(b.x, b.y - 1, r * .78, '#fff');
  }
}
/* Stands. One bobbing fan per grid cell, hue keyed to the cell so the crowd
   stays put frame to frame; only the cells the camera can see are drawn, so
   the cost is flat however long the pitch is. */
/* One spectator, five or six rectangles: body, head, horn, an eye, and every
   other one holding something up. The bob is keyed to world position, so a row
   of them ripples instead of pulsing in unison, and a goal sets them jumping. */
function fan(x, y, i, h) {
  const b = sin(t * .07 + i * .7) > .3 ? 1 : 0,
        hh = h + i % 3 * 9;
  R(x, y - b, 3, 3, C(hh, 40, 52));                     // body
  R(x, y - 3 - b, 3, 2, C(hh, 52, 58));                 // head
  R(x + 1, y - 5 - b, 1, 2, C(hh + 30, 62, 72));        // horn
}
/* Two rows behind each goal, three columns down each side; the corners get
   both. Each end wears the hue of the team defending it. */
/* The way in and out: four tunnel mouths sunk into the moat between the pitch
   and the crowd, one either side of each half. The medics come out of the
   nearest one and carry the casualty back into it. They sit clear of the
   padded rail, which is why they are further out than the wall itself. */
const tunX = x => x < CX ? FL - 23 : FR + 13;
const tunY = y => y < FB / 2 ? FB * .28 : FB * .72;
function tunnels() {
  for (const sx of [FL - 24, FR + 12]) for (const f of [.28, .72]) {
    const y = FB * f - 13;
    R(sx - 1, y - 3, 14, 30, C(280, 26, 45));        // door frame
    R(sx, y, 12, 26, '#090512');                     // the hole itself
    for (let i = 0; i < 4; i++)                      // light from somewhere inside
      R(sx + 1 + i, y + 18 + i * 2, 10 - i * 2, 8 - i * 2, C(45, 20 + i * 7, 55));
    for (let i = 0; i < 3; i++)                      // rainbow over the door
      R(sx - 1, y - 3 + i, 14, 1, C(i * 70 + t * 2, 60));
  }
}
function stands() {
  const hm = TEAMS[0].h, fo = foeTeam().h, x0 = camX | 0, y0 = cam | 0,
  /* the stands sit entirely outside the old camera limits, so they are only
     worth drawing while the camera is past one of them */
        tp = y0 < 0, bt = y0 > FB - VH, lf = x0 < 0 && !AR.sky, rt = x0 > CAMX && !AR.sky;
  if (lf || rt) tunnels();
  if (tp || bt) for (let x = x0 - 24 - x0 % 6; x < x0 + W + 6; x += 6)
    for (let r = 0; r < 2; r++) {
      if (tp) fan(x + r * 3, -19 + r * 7, x + r, fo);
      if (bt) fan(x + r * 3, FB + 8 + r * 7, x - r, hm);
    }
  if (lf || rt) for (let y = y0 - 24 - y0 % 6; y < y0 + VH + 6; y += 6)
    for (let c = 0; c < 3; c++) {
      const h = y < FB / 2 ? fo : hm;
      if (Math.abs(y - FB * .28) < 22 || Math.abs(y - FB * .72) < 22) continue;  // tunnel mouth
      if (lf) fan(FL - 27 + c * 7, y + c * 3, y + c, h);
      if (rt) fan(FR + 8 + c * 7, y + c * 3, y - c, h);
    }
}
const RW = 9;              // how far the padded rail stands out past the wall
function arena() {
  const A = AR, h = specT ? A.f + t * 2 : A.f, nt = A.fl < 40;   // full spectrum cycles the surface
  R(camX - 4, cam - 4, W + 8, VH + 8, C(h, 15, 34));            // dusk beyond the rail
  stands();
  /* genArena() has always rolled a third of arenas dark (fl 24-34) and nothing
     ever read it. Now it is a night match: a darker surface, and floodlights
     from the four corners that bloom. */
  R(FL, FT, PW, FB - FT, C(h, nt ? 40 : 76, 44));               // the surface
  /* Haze, not stripes: a faint wide band every 26 units with a soft puff of
     cloud riding on it, both keyed to world y so nothing crawls when it scrolls. */
  for (let y = FT; y < FB; y += 26) {
    R(FL, y, PW, 13, C(h + 14, nt ? 48 : 84, 40, .3));
    cloud(FL + 20 + (PW - 40) * (sin(y) * .5 + .5), y + 9, 26, C(h - 16, nt ? 52 : 90, 46, .3));
  }
  for (let x = FL; x < FR; x += 6) R(x, FB / 2, 3, 1, C(0, 100, 0, .65));  // halfway
  star(CX, FB / 2, 7, C(0, 100, 0, .5), t * .01);
  for (let i = 1; i < 4; i++) {                       // thirds markings
    if (i === 2) continue;
    for (let x = FL + 4; x < FR; x += 14) R(x, FB * i / 4, 6, 1, C(0, 100, 0, .4));
  }
  /* The padded rail: five two-pixel bands, brightest in the middle of the
     thickness so the frame reads as a rounded cushion rather than a stroke. */
  X.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    X.strokeStyle = C(A.b + i * 32 + sin(t * .02) * 12, 74 - Math.abs(i - 2.5) * 7, 92);
    X.strokeRect(FL - RW + 1 + i * 2, FT - RW + 1 + i * 2,
                 PW + RW * 2 - 2 - i * 4, FB - FT + RW * 2 - 2 - i * 4);
  }
  if (A.sky) { R(FL - RW, FT - RW, RW, FB - FT + RW * 2, '#06030e');   // no side walls: void
    R(FR, FT - RW, RW, FB - FT + RW * 2, '#06030e'); }
  goal(FT, 0, A); goal(FB, 1, A);
  if (A.zap) bumps.forEach(b => { if (t % 90 < 26) ring(b.x, b.y, 55, b.r + 7, 10); });
  bumps.forEach(b => bumper(b, A));
}
function goal(y, bottom, A) {
  const g = (GX1 - GX0) / 2, w = GX1 - GX0, d = bottom ? -1 : 1, a0 = bottom ? 0 : PI, a1 = bottom ? PI : 7;
  X.save();
  X.beginPath(); X.rect(GX0 - 9, bottom ? y : y - RW - 8, w + 18, RW + 8); X.clip();
  R(GX0, bottom ? y : y - RW, w, RW, '#150a25');
  X.lineWidth = 2;
  for (let i = 3; i--;) {
    X.strokeStyle = C(t * 2 + i * 58, 62);
    X.beginPath(); X.ellipse(CX, y, g + 1 + i * 2.5, 9 + i * 2, 0, 0, 7); X.stroke();
  }
  const gr = X.createLinearGradient(0, y, 0, y - d * 9);          // the tunnel: floor lit, back black
  gr.addColorStop(0, C(A.b, 44, 42)); gr.addColorStop(.45, C(A.b, 12, 30)); gr.addColorStop(1, '#000');
  X.fillStyle = gr; X.beginPath(); X.ellipse(CX, y, g - 1, 8, 0, 0, 7); X.fill();
  X.lineWidth = 1.5;                                                // the bevel
  X.strokeStyle = C(A.b, 82, 60); X.beginPath(); X.ellipse(CX, y, g, 8.5, 0, a0, a1); X.stroke();
  X.strokeStyle = 'rgba(0,0,0,.7)'; X.beginPath(); X.ellipse(CX, y, g - 2, 6.5, 0, a0, a1); X.stroke();
  X.restore();
}
function star(x, y, r, c, rot) {
  X.fillStyle = c; X.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + i * PI / 5, d = i % 2 ? r * .45 : r;
    X[i ? 'lineTo' : 'moveTo'](x + cos(a) * d, y + sin(a) * d);
  }
  X.fill();
}
/* The star bank, set into the side rails, each lit in the colours of whoever
   lit it - 1 is yours, 2 is theirs - and dull brass while nobody has. */
function bankStars() {
  /* Fourteen stars, seven a side, each its own: bank[i] is the left star on
     row i, bank[i + 7] the right one. Lit ones sit still and wear the team disc
     colours - blue yours, red theirs, the pair under the unicorns' feet - so
     the bank reads at a glance; unlit ones keep their rainbow colour, dimly. */
  for (let i = 0; i < 14; i++) {
    const on = bank[i], r = on ? 6 : 5, y = STARY[i % 7], x = i < 7 ? FL - 3 : FR + 3,
          c = on ? (on === 1 ? C(214, 56, 94) : C(2, 52, 94)) : C(i % 7 * 51, 30, 40);
    star(x, y, r + 3, '#1d1030', 0);                                // socket
    star(x, y, r, c, 0);
  }
}
