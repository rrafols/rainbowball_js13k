/* The same ten lines at every level, sharpened by the division. `iq` runs 0 to
   .75 and does five things: they shoot more often and aim tighter, they use the
   rails more, they commit to the tackle harder, they run straighter at goal
   instead of weaving, and they chase where a loose ball is GOING rather than
   where it is. Nothing new is bolted on - the same brain just stops being
   generous, which is what makes a division feel harder rather than cheaper. */
function think(p) {
  const b = ball, mine = b.own && b.own.t === p.t, iq = div * .25;
  if (boss() && p.t && t % 90 === p.k * 30 && !p.bcd) fireBow(p);   // the boss lays rails
  let tx, ty, want = 0;
  const goalY = p.t ? FB - 6 : FT + 6, ownY = p.t ? FT + 12 : FB - 12;
  if (b.own === p) {
    if (p.k === 0 && rs() < .09 + iq * .04) {         // keeper clearance
      /* Spreads are scaled with the pitch even though they aim at a fixed-width
         goal. Counter-intuitive, but measured: a wider pitch lets the attack get
         free more easily, and the looser aim is what keeps the scoreline near
         where it was. Reverting these to 90/40 doubled the goals conceded.    */
      p.ang = atan2(goalY - p.y, CX + (rs() - .5) * PW * (.49 - iq * .12) - p.x); shoot(p); return;
    }
    ty = goalY;
    /* An open goal is shot at straight, now. `open` is nobody of the other side
       standing near the mouth; then the carrier stops weaving, aims dead centre
       and fires the tick it is in range. Otherwise the old imperfect shot: a
       coin flip a tick and a spread that is now a fraction of the MOUTH, not of
       the pitch - the pitch-fraction spread dated from a 200-wide pitch and on
       this one it missed an empty net eighteen times in thirty. */
    const near = Math.abs(p.y - ty) < 70 + iq * 26,
          open = !pl.some(o => o.t !== p.t && !o.down && Math.abs(o.x - CX) < 34 && Math.abs(o.y - ty) < 70);
    tx = near && open ? CX : CX + sin(t * .03 + p.x) * (34 - iq * 20);
    if (!p.bcd && !open && Math.abs(p.y - ty) < 115 && rs() < .014 + iq * .014) {
      p.ang = atan2(ty - p.y, CX - p.x); fireBow(p); return;    // rail toward goal
    }
    if (near && (open || rs() < .03 + iq * .05)) {
      p.ang = atan2(ty - p.y, CX + (open ? 0 : (rs() - .5) * (GX1 - GX0) * (.8 - iq * .4)) - p.x); shoot(p); return;
    }
  } else if (p.k === 0 && !mine) {                        // the one who stays home
    if (!p.bcd && rs() < .022 + iq * .012 && Math.abs(b.y - ownY) < 85 && Math.abs(p.y - ownY) < 22) {
      p.ang = p.x < CX ? 0 : PI; fireBow(p); return;       // shield across own mouth
    }
    /* across the mouth, not across 84..116 - those were the goal's x on the old
       200-wide pitch, and on this one they left the right half of the goal
       unreachable */
    tx = clamp(b.x + b.vx * 5, GX0 + 4, GX1 - 4); ty = ownY; want = 2;
  } else if (mine) {
    if (!p.bcd && rs() < .01 && Math.abs(p.y - goalY) < 95) {
      p.ang = atan2(goalY - p.y, CX - p.x); fireBow(p); return;   // lay one on for a mate
    }
    tx = b.own.x + (p.x < CX ? -60 : 60); ty = b.own.y + (p.t ? 34 : -34);
  } else if (b.own) {
    let near = 1;                                     // am I the closest of my three?
    const md = hyp(b.own.x - p.x, b.own.y - p.y);
    pl.forEach(o => { if (o.t === p.t && o !== p && !o.down && o.k &&
      hyp(b.own.x - o.x, b.own.y - o.y) < md) near = 0; });
    if (near) { tx = b.own.x; ty = b.own.y; want = md < 15 ? 1 : 0; }
    else {                                          // hold your slot, shaded toward the ball
      const hp = home(p.k, p.t, FB);
      tx = hp[0] + (b.x - hp[0]) * .4; ty = hp[1] + (b.y - hp[1]) * .44;
    }
  } else { tx = b.x + b.vx * iq * 9; ty = b.y + b.vy * iq * 9; }   // lead a loose ball
  const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy) || 1;
  const urge = want === 2 ? 1.45 : .8 + iq * .22;         // keepers commit harder
  p.vx += dx / d * accOf(p) * urge; p.vy += dy / d * accOf(p) * urge;
  if (want === 1 && !p.cool && rs() < (p.ag || .3) + iq * .2) { p.ang = atan2(dy, dx); tackle(p); }
}
