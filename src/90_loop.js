/* ---------- 14. loop ---------------------------------------- */
let last = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min(50, now - last); last = now;
  music();
  while (acc > 16.6) { acc -= 16.6; tick(); }
  render();
}
function look(x, y, e) {                            // ease the camera onto a point
  cam += (clamp(y - VH / 2, -OUT, FB - VH + OUT) - cam) * e;
  camX += (clamp(x - W / 2, -OUT, CAMX + OUT) - camX) * e;
}
function tick() {
  if (hstop) return hstop--;                         // hit-stop: nothing moves, not even t
  t++;
  if (st === 'ready' && !tutSeen) { tutSeen = 1; tipI = +touch; }   // the one card, once: keys or touch
  if (tipI >= 0) return;                             // and holds everything while it is up
  if (st === 'ready') { phase--; if (phase <= 0) { st = 'play'; say('PLAY!'); } }
  else if (st === 'goal') {
    if (phase % 9 === 4) {                           // fireworks over the whole phase
      const fx1 = FL + rs() * (FR - FL), fy = cam + 20 + rs() * (VH - 40);
      ring(fx1, fy, -1, 34, 20); boom(fx1, fy, 10, -1, 3.4, 1);
      boom(fx1, fy, 6, -1, 2.2, 0); snd(600 + rs() * 500, .07, 'sine', .03, 1600);
    }
    if (phase % 3 === 0) boom(FL + rs() * (FR - FL), cam - 10, 2, -1, 1.6);  // ticker tape
    phase--; if (phase <= 0) kickoff(0);
  }
  else if (st === 'play') {
    if (hurt) stepMedics();                          // play stops for the stretcher
    else {
      clock -= 1 / 60;
      stepPlayers(); stepBall(); stepBows(); stepGhosts();
      if (specT) specT--;
      if (AR.move) bumps.forEach(b => { if (!b.l) b.x = b.hx + sin(t * .012 + b.ph) * 26; });
      const cf = ball.own || ball;                   // camera follows both axes
      look(cf.x, cf.y, .09);
      bumps.forEach(b => { if (b.l) b.l--; });
      if (clock <= 0) endMatch();
    }
  }
  updateFx();
  act = 0; bowBtn = 0;
  if (shake > 0) shake--;
}
let lastSt = '', stT = 0;
function render() {
  if (st !== lastSt) { lastSt = st; stT = t; }      // when this screen arrived
  X.save();
  if (shake > 0) X.translate((rs() - .5) * shake, (rs() - .5) * shake);
  if (st === 'title') lit ? title() : boot();
  else if (st === 'depot') depot();
  else if (st === 'promo') promo();
  else if (st === 'done') done();
  else {
    X.save();
    X.beginPath(); X.rect(0, VT, W, VH); X.clip();
    X.translate(-(camX | 0), VT - (cam | 0));
    arena(); bankStars(); drawBows(); medics(); drawPlayers(); drawBall(); drawFx();
    X.restore();
    vignette();
    hud();
    if (st === 'ready' && phase > 20) txt(Math.ceil(phase / 30), 100, 140, 0, 4, 1, t * 4);
    if (st === 'over') results('FULL TIME', 2, [sc[0] + ' - ' + sc[1],
      held ? 'YOU WIN' : sc[0] === sc[1] ? 'A DRAW' : 'YOU LOSE',
      DIVS[div] + ' LEAGUE  MATCH ' + (mIn + 1) + '/3',
      ...squad.filter(p => p.inj && p.inj.m > 0).map(p => p.name.slice(0, 11) + ' ' + INJT[p.inj.s])], 1);
  }
  if (st === 'play' || st === 'ready' || st === 'goal') banner();
  if (st === 'goal') goalCam();                       // cuts over the banner
  else if (hurt && hurt.ph < HURTCAM) camPanel(hurt.p, hurt.ph, 1, HURTCAM - hurt.ph);
  bloom();                                           // the whole frame, cards excepted
  /* a rainbow curtain drops away to reveal every menu; play, ready and goal
     cut instead, since a wipe mid-match would read as a stutter */
  const fk = 1 - clamp((t - stT) / 10, 0, 1);
  if (fk && 'title depot promo done over'.includes(st))
    for (let i = 0; i < 7; i++) R(0, H * (1 - fk) + i * 43 - 1, W, 44, C(i * 51, 60, 90, .9));
  if (tipI >= 0) tipCard();
  achCard();                                         // over the lot, wherever you are
  X.restore();
}
requestAnimationFrame(frame);
