/* ---------- 2. 3x5 pixel font (5 octal digits per glyph) ----- */
const FK = "0123456789ABCDEFGHIJKLMNOPRSTUVWXYZ-!?.+/",
      FD = "7555726227717477171755711747177475771222757577571725755656563444365556746477464434553557557222711152556554444757755655552555265644656553421672222555575555255775552555522271247007002220271302000020272011244";
function glyph(g, x, y, s, c) {
  for (let r = 0; r < 5; r++) { const b = +g[r];
    for (let i = 0; i < 3; i++) if (b >> (2 - i) & 1) R(x + i * s, y + r * s, s, s, c); }
}
// al: 0 left, 1 centre, 2 right.  rb: rainbow mode (hue offset)
function txt(str, x, y, c, s = 1, al = 0, rb = -1) {
  str = (str + '').toUpperCase();
  const w = str.length * 4 * s - s;
  if (al === 1) x -= w / 2 | 0; else if (al === 2) x -= w;
  for (let i = 0; i < str.length; i++) {
    const k = FK.indexOf(str[i]);
    if (k >= 0) glyph(FD.substr(k * 5, 5), x, y, s, rb >= 0 ? C(rb + i * 26, 62) : c);
    x += 4 * s;
  }
  return w;
}
