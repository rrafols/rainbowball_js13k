function stepBall() {
  const b = ball;
  if (b.cd) b.cd--;
  if (b.own) {                                     // carried in front of the horn
    const p = b.own;
    b.x = p.x + cos(p.ang) * 7; b.y = p.y + sin(p.ang) * 7; b.vx = b.vy = 0;
    if (p.down) { b.own = null; b.cd = 12; }
    return;
  }
  const fr = AR.ice ? .997 : .992;
  b.vx *= fr; b.vy *= fr;
  b.x += b.vx; b.y += b.vy;
  /* A shot has height. Above 8 it clears the studs and nobody can catch it;
     a rail passing under it lifts it further (see stepBows). */
  b.z = Math.max(0, b.z + b.vz); b.vz = b.z ? b.vz - .055 : 0;
  const bs = hyp(b.vx, b.vy);                     // the ball smokes when it flies
  if (bs > 1.6 && t % 2 === 0) boom(b.x, b.y, 1, t * 7, .6, 0);

  // walls, with the star bank baked into the side rails
  if (b.x < FL + 3 || b.x > FR - 3) {
    if (AR.sky) return lost();                         // no wall there to hit
    b.x = clamp(b.x, FL + 3, FR - 3); b.vx *= -.86; hitWall(b.x > CX, b.y);
  }
  if (b.y < FT + 3) {
    if (b.x > GX0 && b.x < GX1) return score(0);
    b.y = FT + 3; b.vy *= -.86; boom(b.x, b.y, 4, -1, 2);
  }
  if (b.y > FB - 3) {
    if (b.x > GX0 && b.x < GX1) return score(1);
    b.y = FB - 3; b.vy *= -.86; boom(b.x, b.y, 4, -1, 2);
  }
  // cloud bumpers
  bumps.forEach(m => {
    const dx = b.x - m.x, dy = b.y - m.y, d = hyp(dx, dy);
    if (d < m.r + 3 && d > 0 && b.z < 8) {              // a high ball clears it
      const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
      b.vx = (b.vx - 2 * dot * nx) * 1.12; b.vy = (b.vy - 2 * dot * ny) * 1.12;
      b.x = m.x + nx * (m.r + 3); b.y = m.y + ny * (m.r + 3);
      boom(b.x, b.y, 14, -1, 2.6); ring(b.x, b.y, -1, 22, 16); puff(b.x, b.y, 200, 4);
      snd(520, .06, 'sine', .04, 700); charge(3);
    }
  });
  // pickup
  if (!b.cd) for (const p of pl) {
    if (p.down) continue;
    if (hyp(p.x - b.x, p.y - b.y) < 8 && b.z < 8) {
      b.own = p; b.last = p.t; b.by = p; snd(700, .05, 'square', .03);
      if (p.t === 0) charge(2);
      break;
    }
  }
}
/* over the edge of a sky pitch: the ball is gone, a new one drops at the spot */
function lost() {
  const b = ball;
  boom(b.x, b.y, 30, -1, 3, 1); say('LOST!'); snd(500, .4, 'sawtooth', .05, 60);
  b.x = CX; b.y = FB / 2; b.vx = b.vy = b.z = b.vz = 0; b.cd = 30;
}
/* prism: a ball that has ridden a whole rail leaves it as a fan of three */
function prism() {
  const b = ball;
  for (const a of [-.4, .4]) ghs.push({ x: b.x, y: b.y, life: 50, t: b.last,
    vx: b.vx * cos(a) - b.vy * sin(a), vy: b.vx * sin(a) + b.vy * cos(a) });
  ring(b.x, b.y, -1, 30, 18); snd(900, .2, 'sine', .05, 1800);
}
function stepGhosts() {
  for (let i = ghs.length; i--;) {
    const g = ghs[i];
    g.x += g.vx; g.y += g.vy;
    if (g.x < FL + 3 || g.x > FR - 3) g.vx *= -1;
    if (--g.life < 0) { ghs.splice(i, 1); continue; }
    const end = g.y < FT + 3 || g.y > FB - 3;
    if (end && g.x > GX0 && g.x < GX1) { ghs.splice(i, 1); return score(g.y < FB / 2 ? 0 : 1); }
    if (end) g.vy *= -1;
  }
}
function hitWall(side, y) {
  boom(ball.x, ball.y, 5, -1, 2); snd(400, .05, 'square', .03);
  for (let i = 0; i < 7; i++) if (bank[i + side * 7] !== 1 + ball.last && Math.abs(y - STARY[i]) < 16) {   // unlit, or theirs
    /* A star remembers who lit it: 1 you, 2 them. The bank is neutral - either
       side can light any star - and a star stays lit for the rest of the match,
       so the five of them are a running multiplier on everything you score, and
       the race for them is a second game going on down the side rails. */
    /* stars are contested: hitting one the other side lit flips it. The bank is
       territory, not a ledger, and the rail race stays alive all match. */
    if (bank[i + side * 7]) say(ball.last ? 'STAR STOLEN!' : 'STAR TAKEN!');
    bank[i + side * 7] = 1 + ball.last; charge(8); snd(900 + i * 120, .08, 'sine', .05);
    if (bank.slice(side * 7, side * 7 + 7).every(v => v === 1 + ball.last)) {   // all seven on this side: FULL SPECTRUM
      specT = 1200; specTeam = ball.last; sweep = 60;
      if (!ball.last) ach(7);
      say(ball.last ? 'THEIR SPECTRUM!' : 'FULL SPECTRUM!');
      snd(300, .6, 'sine', .07, 2400);
    }
    const bh = ball.last ? foeTeam().h : TEAMS[0].h;
    boom(side ? FR + 4 : FL - 4, STARY[i], 18, bh, 2.8, 0);
    ring(side ? FR + 4 : FL - 4, STARY[i], bh, 26, 18);
  }
}
/* Speedball scoring: a goal is ten, and every star you have lit down the side
   rails adds another tenth of that - one point each, five stars being half as
   much again. Putting an opponent in the ambulance is worth the same as a goal,
   multiplier and all, which is the whole reason to play rough. The stars stay
   lit for the match, so the bank is a race and not a lottery. */
const pts = team => 10 + bank.filter(v => v === team + 1).length;
function score(team) {
  const g = pts(team);
  sc[team] += g;
  if (team === 0) { money += 150 + div * 50; charge(30); ach(0); if (++gls > 2) ach(1); }   // HAT TRICK counts goals, not points
  scorer = ball.by;                          // the face the goal camera cuts to
  say(scorer && scorer.t !== team ? 'OWN GOAL!' : 'GOAL!  +' + g);
  const gy = team ? FB : FT, gh = team ? foeTeam().h : TEAMS[0].h;
  /* park it in the mouth: it froze wherever the crossing tick left it, which
     was anywhere from three units short of the wall to a step past it, at
     whatever height it was flying - so it drew in front of the line or on top
     of the wall. Five units in is the dark half of the hole. */
  ball.x = CX; ball.y = gy + (team ? 4 : -4); ball.z = ball.vx = ball.vy = 0;   // the hole is 8 deep only at its middle
  boom(CX, gy, 70, gh, 5, 1);
  boom(CX, gy, 60, -1, 6, 1);
  puff(CX, gy, gh, 10);
  ring(CX, gy, gh, 90, 34); ring(CX, gy, -1, 60, 26);
  for (let i = 0; i < 10; i++) boom(FL + rs() * (FR - FL), FT + rs() * (FB - FT), 4, -1, 2, 0);
  shake = 9; sweep = 40;
  snd(400, .5, 'square', .06, 1200);
  st = 'goal'; phase = GOALT;
}
function endMatch(w) {                        // w forces a winner: a team with nobody left
  const won = w === undefined ? sc[0] > sc[1] : w === 0;
  if (won) { wins++; dw++; money += 700 + div * 700; if (!sc[1]) ach(2); }   // was * 400: too flat to keep pace
  money += 250 + div * 150;                  // appearance money: losing still pays something
  injuries();
  held = won;
  say(w !== undefined ? 'NOBODY LEFT!'
      : won ? 'YOU WIN!' : sc[0] === sc[1] ? 'DRAW' : 'YOU LOSE');
  st = 'over'; phase = 0;
  snd(won ? 660 : 160, .6, 'triangle', .06, won ? 1320 : 80);
}
