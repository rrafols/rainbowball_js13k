/* ---------- 8. THE UNICORN: drawn, then lit by rule ---------- */
/* SPIKE 6b — the same two rules as uni_6_relight, done with canvas compositing
   instead of a pixel loop, so nothing is ever read back from the GPU.
     RIM   — the sprite drawn four times, one pixel each way, then `source-in`
             flooded flat: that is a dilated silhouette, i.e. an outline.
     LIGHT — the sprite with the sprite-shifted-down punched out of it is
             exactly the pixels with sky above them; flood that white.
   Both are shape-agnostic and neither knows what a unicorn is. */
const nc = () => { const c = document.createElement('canvas'); c.width = c.height = 24; return c; };
const OC = nc(), O2 = nc(), O3 = nc(),
      OX = OC.getContext('2d'), X2 = O2.getContext('2d'), X3 = O3.getContext('2d');
function unicorn(cx, cy, hue, q, f, ph, down, a = 0) {
  /* Bit 7 says this one is mid-dash. The front of the animal goes a pixel
     forward and the tail a pixel back, which stretches the silhouette by two
     without a fractional transform anywhere - the lesson from spike 3. */
  const A = ARCH[a & 7], tr = a >> 3 & 15, fw = a >> 7 & 1,
        body = C(hue, 80, 70), mane = mxd(q) ? C(t * 4, 62) : C(hue + A.m, 62), shade = C(hue, 56, 56),
        armC = C(hue + 180, 56), gold = '#ffd52a', hornC = C(hue + 40, 72),
        r = (x, y, w, h, c) => { OX.fillStyle = c; OX.fillRect(x | 0, y | 0, w, h); };
  OX.setTransform(1, 0, 0, 1, 0, 0);
  OX.clearRect(0, 0, 24, 24);
  OX.translate(12, 12);
  if (down) OX.rotate(clamp(down / 6, 0, 1) * PI);
  OX.scale(f, 1);
  OX.translate(-6, -7 + Math.round(sin(ph * .5) * .5));
  const g = Math.round(sin(ph)), b = -g,                  // gallop from one sin()
        hoof = q[1] > 3 ? gold : C(hue + A.m, 50, 64);    // or tinted by the kind
  r(0 - fw, 5, 2, 2, mane); r(-1 - fw, 7, 2, 2, mane);    // tail, trailing
  r(3, 9, 2, 3 + g, shade); r(7, 9, 2, 3 + b, shade);    // legs
  if (tr & 8) { r(3, 10 + g, 2, 1, '#fff'); r(7, 10 + b, 2, 1, '#fff'); }  // socks
  r(3, 11 + g, 2, 1, hoof); r(7, 11 + b, 2, 1, hoof);     // hooves, gilded by SPD
  r(2, 4, 7, 5, body);                                   // body
  if (q[2] > 3) r(3, 5, 4, 2, armC);                     // the saddle it earned
  r(7 + fw, 2, 3, 4, body); r(8 + fw, 1, 4, 3, body); r(11 + fw, 2, 2, 2, body);
  r(9 + fw, 0, 1, 1, body);                              // ear
  r(6, 1, 2, 5, mane); r(3, 3, 2, 3, mane);              // mane
  if (tr & 1) { r(8 + fw, 1, 4, 1, '#3a2450'); r(10 + fw, 2, 2, 2, '#1a1030'); }
  else r(10 + fw, 2, 1, 1, '#151022');                   // patch and strap, or an eye
  if (tr & 4) r(8 + fw, 4, 1, 1, gold);                  // an earring under the ear
  r(10 + fw, -1 - A.k, 1, 2 + A.k, q[0] > 3 ? gold : hornC);   // horn
  if (tr & 2) r(10 + fw, -A.k, 1, 1, '#fff');            // ...striped on some
  const wipe = (g, o) => { g.clearRect(0, 0, 24, 24); g.globalCompositeOperation = o; };
  wipe(X2, 'source-over');
  X2.drawImage(OC, 1, 0); X2.drawImage(OC, -1, 0);       // dilate by one pixel
  X2.drawImage(OC, 0, 1); X2.drawImage(OC, 0, -1);
  X2.globalCompositeOperation = 'source-in';
  X2.fillStyle = '#2a143a'; X2.fillRect(0, 0, 24, 24);   // flood it: the rim
  wipe(X3, 'source-over');
  X3.drawImage(OC, 0, 0);
  X3.globalCompositeOperation = 'destination-out';
  X3.drawImage(OC, 0, 1);                                // keep only the top edge
  X3.globalCompositeOperation = 'source-in';
  X3.fillStyle = 'rgba(255,255,255,.42)'; X3.fillRect(0, 0, 24, 24);
  const x0 = (cx | 0) - 12, y0 = (cy | 0) - 12;
  X.drawImage(O2, x0, y0); X.drawImage(OC, x0, y0); X.drawImage(O3, x0, y0);
}
