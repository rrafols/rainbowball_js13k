function stepPlayers() {
  // hero = my unicorn nearest the ball (unless I'm carrying it)
  if (!(ball.own && ball.own.t === 0)) {
    let best = 1e9;
    pl.forEach(p => { if (p.t) return;
      const d = hyp(p.x - ball.x, p.y - ball.y) + p.down * 3;
      if (d < best) { best = d; hero = p; } });
  } else hero = ball.own;

  pl.forEach(p => {
    if (p.bcd) p.bcd--;
    if (p.slide) {                                    // respawns down a rainbow
      p.slide += .022;
      const gy = p.t ? 40 : FB - 40;
      p.x += (CX - p.x) * .04; p.y += (gy - p.y) * .04;
      p.trail.unshift([p.x, p.y + 5]); p.trail.length = Math.min(p.trail.length, 9);
      boom(p.x, p.y + 4, 1, -1, 1, 0);
      if (p.slide > 1.9) { p.slide = 0; p.down = 0; p.vx = p.vy = 0;
        ring(p.x, p.y, -1, 40, 22); boom(p.x, p.y, 20, p.hue, 3, 1); }
      return;
    }
    if (p.down > 0) { p.down--; p.vx *= .82; p.vy *= .82; p.x += p.vx; p.y += p.vy;
      p.x = clamp(p.x, FL + 5, FR - 5); p.y = clamp(p.y, FT + 5, FB - 5); return; }
    if (p.cool) p.cool--;
    if (p === hero) {
      let dx = (K.arrowright || K.d ? 1 : 0) - (K.arrowleft || K.a ? 1 : 0);
      let dy = (K.arrowdown || K.s ? 1 : 0) - (K.arrowup || K.w ? 1 : 0);
      dx += jx; dy += jy;
      const d = hyp(dx, dy);
      if (d > .15) { p.vx += dx / d * accOf(p); p.vy += dy / d * accOf(p); p.ang = atan2(dy, dx); }
      const A = act || K[' '] || K.k;
      if (A && !p.cool) { if (ball.own === p) shoot(p); else tackle(p); }
      if (bowBtn || K.r || K.q) fireBow(p);
    } else think(p);

    if (p.dash > 0) { p.dash--; p.vx += cos(p.ang) * .35; p.vy += sin(p.ang) * .35; }
    const mx = spdOf(p) * (p.dash > 0 ? 1.7 : 1) * 1.9;
    const sp = hyp(p.vx, p.vy);
    if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
    const dr = AR.ice ? .91 : .87;             // ice: the unicorns drift a little too
    p.vx *= dr; p.vy *= dr;
    p.x = clamp(p.x + p.vx, FL + 5, FR - 5);
    p.y = clamp(p.y + p.vy, FT + 5, FB - 5);
    if (Math.abs(p.vx) > .2) p.f = p.vx > 0 ? 1 : -1;
    bumps.forEach(m => {                              // studs are solid for unicorns too
      const dx = p.x - m.x, dy = p.y - m.y, d = hyp(dx, dy);
      if (d < m.r + 5 && d > 0) {
        const nx = dx / d, ny = dy / d;
        p.x = m.x + nx * (m.r + 5); p.y = m.y + ny * (m.r + 5);
        p.vx = p.vx * .3 + nx * .8; p.vy = p.vy * .3 + ny * .8;
        if (AR.zap && t % 90 < 26 && !p.down) {       // electrified arena
          p.down = 46; drain(p, .12); boom(p.x, p.y, 20, 55, 3, 1); ring(p.x, p.y, 55, 30, 18);
          snd(140, .12, 'sawtooth', .05, 60); say('ZAPPED!');
        }
      }
    });

    // rainbow trail: free graphics
    if (sp > .9 && p.cs[1] > 3) {                     // fast unicorns leave a trail
      p.trail.unshift([p.x, p.y + 5]); p.trail.length = Math.min(p.trail.length, 9);
    } else if (p.trail.length && t % 3 === 0) p.trail.pop();
  });

  // body checks + separation
  for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) {
    const a = pl[i], b = pl[j], dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy);
    if (d > 11 || d === 0) continue;
    const nx = dx / d, ny = dy / d, ov = (11 - d) / 2;
    a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
    if (a.t !== b.t && !a.down && !b.down) {
      /* TKL both attacks and resists. The roll is taken once, in tackle(), and
         carried on .rol - rolling per tick would re-try it ten times a dash and
         wash the stat out. Level tackler wins about three in five; each point
         either way moves it by roughly a sixth. */
      if (a.dash > 0 && tklOf(a) + a.rol > tklOf(b) + 4.5) knock(b, a);
      else if (b.dash > 0 && tklOf(b) + b.rol > tklOf(a) + 4.5) knock(a, b);
      else { a.vx -= nx; a.vy -= ny; b.vx += nx; b.vy += ny; }
    }
  }
}
