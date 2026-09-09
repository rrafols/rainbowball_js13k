/* ---------- 10. input --------------------------------------- */
const K = {};
let jx = 0, jy = 0, jid = -1, jox = 0, joy = 0, act = 0, bowBtn = 0, touch = 0;
const MEN = ['depot'];                            // the one screen the cursor works on
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  K[k] = 1;
  if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  if (!lit) return (lit = 1, snd(1, .01, 'sine', .001), snd(700, .1, 'square', .04, 1400));
  if (tipI >= 0) { tipI = -1; return snd(600, .05); }
  if (st === 'play') return;
  if (MEN.includes(st)) nav(k);
  else if (k === ' ' || k === 'enter') menu();
});
/* One cursor, two columns. The left column picks the unicorn (`sel`), the right
   column and the rows under it are what you do to it (`mi`). Numbers pick a
   unicorn straight off the list, the way the labels say. */
function nav(k) {
  const num = k >= '1' && k <= '9' ? +k - 1 : -1;
  if (k === 'arrowleft') { dcol = 0; return snd(500, .04); }
  if (k === 'arrowright') { dcol = 1; return snd(500, .04); }
  if (k === ' ' || k === 'enter') {
    if (!dcol) { dcol = 1; return snd(600, .05); }
    return doAct(mi);
  }
  const n = dcol ? 5 : squad.length;
  let j = dcol ? mi : sel;
  if (num >= 0 && !dcol) { if (num >= n) return; j = num; }
  else if (k === 'arrowup') j--;
  else if (k === 'arrowdown') j++;
  else return;
  j = (j + n) % n;
  if (dcol) mi = j; else sel = j;
  snd(500, .04);
}
/* the five things you can do: train each stat, promote a reserve, play */
function doAct(i) {
  if (i < 3) return buy(i);
  if (i === 3) return subIn();
  newMatch();
}
function subIn() {                      // promote a sub into the starting three
  if (sel < 5) return snd(120, .1, 'square', .03);
  squad.unshift(squad.splice(sel, 1)[0]); sel = 0;
  snd(700, .08, 'square', .05, 1200);
}
addEventListener('keyup', e => K[e.key.toLowerCase()] = 0);

function pos(e) {                                       // client -> virtual px
  const b = CV.getBoundingClientRect();
  return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H];
}
CV.addEventListener('pointerdown', e => {
  touch = e.pointerType !== 'mouse';                 // before the boot gate, so the title knows
  if (!lit) return (lit = 1, snd(1, .01, 'sine', .001), snd(700, .1, 'square', .04, 1400));
  CV.setPointerCapture(e.pointerId);
  const [x, y] = pos(e);
  if (tipI >= 0) { tipI = -1; snd(600, .05); return; }
  if (st !== 'play') { tap(x, y); return; }
  if (x < W / 2) { jid = e.pointerId; jox = x; joy = y; jx = jy = 0; }
  else if (hyp(x - 172, y - 196) < 18) bowBtn = 1;
  else if (y > VB) mute ^= 1;                        // the sound icon in the bottom bar
  else act = 1;
});
CV.addEventListener('pointermove', e => {
  if (e.pointerId !== jid) return;
  const [x, y] = pos(e), dx = x - jox, dy = y - joy, d = hyp(dx, dy);
  /* a floating stick: full deflection at 9 units, and past that the base is
     dragged along behind the thumb, so a reversal is felt on the next tick
     instead of after a trip back across the dead zone */
  if (d > 9) { jox = x - dx / d * 9; joy = y - dy / d * 9; }
  if (d > 2) { jx = clamp(dx / 9, -1, 1); jy = clamp(dy / 9, -1, 1); } else jx = jy = 0;
});
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, e => {   // cancel: the browser took the touch
  if (e.pointerId === jid) { jid = -1; jx = jy = 0; }
});
/* Tap zones duplicate the y-offsets 82_screens.js draws at. Change both. */
function tap(x, y) {
  if (st === 'title') {                              // the fullscreen box, or start
    if (y > 284 && x < 100) return (mute ^= 1, snd(700, .05));   // the sound icon
    return menu();
  }
  if (st === 'depot') {
    if (y < 154) { for (let i = 0; i < squad.length; i++)
      if (x < 98 && y > 32 + i * 15 && y < 46 + i * 15) {
        sel = i; dcol = 0; return snd(500, .04); } }
    else for (let i = 0; i < 5; i++)
      if (y > 158 + i * 20 && y < 176 + i * 20) { mi = i; dcol = 1; return doAct(i); }
  } else menu();
}
function menu() {
  if (st === 'title') {
    div = 0; mIn = 0; wins = 0; dw = 0; money = 900; sd += 7; sel = 0; mi = 0; dcol = 0;
    newSquad(); newMatch();
  } else if (st === 'over') {
    banT = 0;
    if (++mIn > 2) {                    // three played: two wins takes you up
      mIn = 0; pup = dw >= 2; dw = 0;
      if (pup && ++div > 3) { st = 'done'; return; }
      if (pup) ach(div > 2 ? 5 : 4);
      st = 'promo'; return;
    }
    st = 'depot'; mi = 4; dcol = 1;   // straight to the desk, cursor on KICK OFF
  }
  else if (st === 'promo') { st = 'depot'; mi = 4; dcol = 1; }
  else if (st === 'done') st = 'title';
}
/* Training: a point of STR, SPD or TKL on the selected unicorn. It lands on
   p.s, so it shows on the squad screen now and is felt from the next kickoff,
   when newMatch() copies stats into p.cs. */
function buy(i) {
  const p = squad[sel];
  if (!p) return;
  const lv = p.s[i];
  if (lv >= COST.length) return snd(120, .1, 'square', .04);   // the table's length is the top
  const cost = COST[lv];
  if (money < cost) return snd(90, .15, 'sawtooth', .04);
  money -= cost; p.s[i] = lv + 1;
  if (p.s[i] >= COST.length) ach(6);          // MAXED: one stat at the very top
  snd(600, .07, 'square', .05, 1300); boom(148, 160 + i * 22, 14, p.hue, 2);
}
