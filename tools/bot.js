/* The bot that plays for the camera: chase the ball, tackle whoever has it,
   carry it to the top goal and shoot from the mouth, a rail when the meter
   allows. bot(g, key, release) returns a function to call once a tick.
   setup(g, {div, mIn, sd, stat}) starts a season and jumps to that match. */
const hyp = Math.hypot;
export function bot(g, key, release) {
  const held = {};
  const K = (k, on) => { held[k] = !!on; key(k, on); };
  return () => {
    if (g.st !== 'play') return release();
    const h = g.hero, b = g.ball; if (!h) return release();
    const CX = g.CX;
    let tx, ty, hit = 0, rail = 0;
    if (b.own === h) {
      const gy = 6, dy = h.y - gy;
      tx = CX + (dy > 90 ? Math.sin(g.clock * 2) * 30 : 0); ty = gy;                                // weave, then straighten for the mouth
      if (dy < 80 && Math.abs(h.x - CX) < 14) { tx = h.x; hit = held.w && !h.cool; }               // shoot straight up, from the mouth
      rail = dy > 160 && g.meter >= 25 && (g.clock * 60 | 0) % 240 == 0;
    } else {
      tx = b.x + b.vx * 8; ty = b.y + b.vy * 8;
      if (b.own && b.own.t && hyp(b.own.x - h.x, b.own.y - h.y) < 26) hit = 1;                   // tackle the carrier
      if (!b.own && hyp(b.x - h.x, b.y - h.y) < 14 && (g.clock * 60 | 0) % 20 == 0) hit = 1;    // a dash onto a loose ball
    }
    const dx = tx - h.x, dy = ty - h.y;
    K('d', dx > 4); K('a', dx < -4); K('s', dy > 4); K('w', dy < -4);
    K(' ', hit); K('r', rail);
  };
}
export function setup(g, { div, mIn, sd, stat }) {
  g.skipT = 1; g.lit = 1;
  g.menu(); g.div = div; g.mIn = mIn; g.money = 9000; g.sd = sd;
  g.squad.forEach((p, i) => { p.s = i < 5 ? [stat, stat, stat] : [4, 4, 4]; });
  g.newMatch();
  const A = g.AR;
  console.log('  arena', A.n, JSON.stringify({ len: A.len, zap: !!A.zap, move: !!A.move, ice: !!A.ice, sky: !!A.sky, night: A.fl < 50 }));
}
