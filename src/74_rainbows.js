/* ---------- 11b. RAINBOWS: fired geometry -------------------
   A rail is 9 sampled points of a quadratic curve. Nobody owns
   it: whoever gets there first rides it, including the ball.   */
const BOWCOST = 25;
function fireBow(p) {
  if (p.bcd > 0) return;
  if (p.t === 0 && !(specT && !specTeam)) {   // your AI mates never touch your last bar
    const need = p === hero ? BOWCOST : 60;   // free while your spectrum is up
    if (meter < need) return;
    meter -= BOWCOST * (mxd(p.cs) ? .5 : 1);  // a rainbow unicorn pays half
  }
  p.bcd = 50;
  const a = p.ang, len = 60 + p.cs[0] * 6,      // STR throws the rail further
        bx = p.x + cos(a) * 9, by = p.y + sin(a) * 9,
        ex = bx + cos(a) * len, ey = by + sin(a) * len,
        arc = (rs() < .5 ? 1 : -1) * len * .3,
        mx = (bx + ex) / 2 - sin(a) * arc, my = (by + ey) / 2 + cos(a) * arc,
        pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, v = 1 - u;
    pts.push([clamp(v * v * bx + 2 * v * u * mx + u * u * ex, FL + 2, FR - 2),
              clamp(v * v * by + 2 * v * u * my + u * u * ey, FT + 2, FB - 2)]);
  }
  bows.push({ pts, life: 0, h: p.hue,
    max: boss() && p.t ? 9999 : (p === hero ? 260 : 190) * (specT && specTeam === p.t ? 2 : 1) });
  if (bows.length > 8) bows.shift();
  boom(bx, by, 12, -1, 2.5, 0);
  snd(300, .22, 'sine', .05, 1500);
}
// nearest point on a rail: returns [dist, px, py, tangent x, tangent y]
function onBow(w, x, y) {
  let bd = 1e9, r = null;
  for (let i = 0; i < 8; i++) {
    const a = w.pts[i], b = w.pts[i + 1],
          dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1,
          u = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L, 0, 1),
          px = a[0] + dx * u, py = a[1] + dy * u, d = hyp(x - px, y - py);
    if (d < bd) { bd = d; const l = Math.sqrt(L); r = [d, px, py, dx / l, dy / l]; }
  }
  return r;
}
function stepBows() {
  const b = ball;
  let on = 0;                                           // did the ball ride anything this tick
  for (let i = bows.length; i--;) {
    const w = bows[i];
    if (++w.life > w.max) { bows.splice(i, 1); continue; }
    if (t % 7 === 0) {                                  // the rail sheds sparks
      const p = w.pts[rs() * 9 | 0];
      fx.push({ x: p[0], y: p[1], vx: 0, vy: -.25, life: 0, max: 30, h: rs() * 360,
                s: 0, ty: 1, g: -.004, r: rs() * 7, sp: .08 });
    }
    // the ball
    if (!b.own) {
      const h = onBow(w, b.x, b.y), sp = hyp(b.vx, b.vy);
      if (h && h[0] < 12 && b.z >= 8) {                  // a rail under a flying ball lifts it
        if (b.vz < .5) b.vz += .12;
        if (t % 5 === 0) boom(b.x, b.y - b.z, 2, t * 9, .8, 0);
      }
      else if (h && h[0] < 5.5 && sp > .4 && b.z < 8) {
        const nx = -h[4], ny = h[3], dn = b.vx * nx + b.vy * ny;
        if (Math.abs(dn) > sp * .55) {                  // steep: bank off it
          b.vx = (b.vx - 2 * dn * nx) * 1.18; b.vy = (b.vy - 2 * dn * ny) * 1.18;
          b.x += nx * (dn > 0 ? 2 : -2); b.y += ny * (dn > 0 ? 2 : -2);
          boom(b.x, b.y, 12, -1, 2.6, 0); ring(b.x, b.y, -1, 24, 16);
          snd(700, .07, 'sine', .045, 1200);
        } else {                                        // shallow: ride it
          on = 1; b.ride++;
          const dir = b.vx * h[3] + b.vy * h[4] > 0 ? 1 : -1,
                s2 = Math.min(sp * 1.035 + .05, 5.4);
          b.vx += (h[3] * dir * s2 - b.vx) * .4; b.vy += (h[4] * dir * s2 - b.vy) * .4;
          b.x += (h[1] - b.x) * .3; b.y += (h[2] - b.y) * .3;
          boom(b.x, b.y, 2, t * 9, .8, 0);
          if (t % 6 === 0) snd(500 + sp * 90, .04, 'sine', .025);
        }
      }
    }
    // unicorns get a speed strip out of it too
    pl.forEach(p => {
      if (p.down) return;
      const h = onBow(w, p.x, p.y);
      if (h && h[0] < 7) {
        const dir = p.vx * h[3] + p.vy * h[4] > 0 ? 1 : -1;
        p.vx += h[3] * dir * .17; p.vy += h[4] * dir * .17;
        if (t % 4 === 0) p.trail.unshift([p.x, p.y + 5]), p.trail.length = Math.min(p.trail.length, 9);
      }
    });
  }
  if (!on && b.ride > 18) prism();                     // it rode a whole rail: split
  if (!on) b.ride = 0;
}
function drawBows() {
  bows.forEach(w => {
    const k = w.life > w.max - 60 ? (w.max - w.life) / 60 : 1;
    for (let band = 0; band < 6; band++) {
      X.lineWidth = 1.4;
      X.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = w.pts[i], b = w.pts[Math.min(i + 1, 8)],
              dx = b[0] - a[0], dy = b[1] - a[1], l = hyp(dx, dy) || 1,
              o = band - 2.5;
        const x = a[0] + (-dy / l) * o, y = a[1] + (dx / l) * o;
        X[i ? 'lineTo' : 'moveTo'](x, y);
      }
      X.strokeStyle = C(t * 3 + band * 44, 62, 100, .85 * k);
      X.stroke();
    }
  });
}
