/* ---------- 7. particles: three types, one array -----------
   1 star sparkle  3 shockwave ring  4 smoke puff                */
function boom(x, y, n, hue, spd = 3, big = 0) {
  if (fx.length > 620) return;
  for (let i = n; i--;) {
    const a = rs() * 7, v = .4 + rs() * spd;
    fx.push({
      x, y, vx: cos(a) * v, vy: sin(a) * v, life: 0, max: 20 + rs() * 26 | 0,
      h: hue < 0 ? rs() * 360 : hue + rs() * 90 - 45,
      ty: 1,
      g: big ? .07 : .025, r: rs() * 7, sp: (rs() - .5) * .5
    });
  }
}
function ring(x, y, hue, r1 = 46, life = 26) {
  fx.push({ x, y, ty: 3, h: hue < 0 ? rs() * 360 : hue, life: 0, max: life, r0: 4, r1 });
}
function puff(x, y, hue, n = 6) {
  for (let i = n; i--;) {
    const a = rs() * 7, v = .3 + rs() * 1.4;
    fx.push({ x, y, vx: cos(a) * v, vy: sin(a) * v - .3, life: 0, max: 26 + rs() * 18 | 0,
      h: hue, s: 1, ty: 4, g: -.012, r: 0, sp: 0 });
  }
}
function updateFx() {
  for (let i = fx.length; i--;) {
    const q = fx[i];
    q.life++;
    if (q.ty !== 3) {
      q.x += q.vx; q.y += q.vy;
      q.vx *= .945; q.vy = q.vy * .945 + q.g; q.r += q.sp;
    }
    if (q.life > q.max) fx.splice(i, 1);
  }
}
