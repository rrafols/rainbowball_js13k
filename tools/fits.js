/* Does the text fit? The 3x5 font is 4*s wide a character (less one s at the
   end) and 5*s tall, so every txt() call has a knowable extent. This walks src/
   for calls with a literal string and flags anything that leaves the 200x300
   screen; calls that build their string at runtime are listed with the longest
   they could plausibly get, since those are the ones that bite.           */
import { readFileSync, readdirSync } from 'fs';
const W = 200, H = 300;
/* A character the font has no glyph for draws NOTHING, silently - that is how a
   '?' shipped invisible on the title screen and an '=' inside a tutorial line.
   Pull the real glyph table out of 12_font.js and check every literal. */
const FONT = readFileSync('src/12_font.js', 'utf8');
const GL = new Set(FONT.match(/const FK = "([^"]+)"/)[1] + ' ');   // the key string, plus space (draws nothing, on purpose)
let missing = 0;
/* split a call's arguments at top level - C(320, 70) is ONE argument */
function args(src, i) {
  const out = []; let d = 0, q = 0, cur = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { cur += c; if (c === q) q = 0; continue; }
    if (c === "'" || c === '"') { q = c; cur += c; continue; }
    if (c === '(' || c === '[') d++;
    if (c === ')' && !d) { out.push(cur.trim()); return out; }
    if (c === ')' || c === ']') d--;
    if (c === ',' && !d) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  return out;
}
let bad = 0; const dyn = [], skip = [];
for (const f of readdirSync('src').filter(n => n.endsWith('.js')).sort()) {
  const src = readFileSync('src/' + f, 'utf8');
  for (let i = 0; (i = src.indexOf('txt(', i)) >= 0; i += 4) {
    if (/[\w.]/.test(src[i - 1] || '')) continue;
    const a = args(src, i + 4);
    if (a.length < 3) continue;
    const line = src.slice(0, i).split('\n').length;
    /* the scale can itself be an expression, which cannot be checked from
       source, so take the largest scale any literal number in it could be */
    let s = a[4] ? +a[4] : 1, al = a[5] ? +a[5] : 0;
    if (!isFinite(s)) s = Math.max(...(a[4].match(/\d+/g) || [1]).map(Number));
    if (!isFinite(al)) al = 0;
    const lit = /^'[^']*'$/.test(a[0]);
    const str = lit ? a[0].slice(1, -1) : a[0];
    const x = +a[1], y = +a[2];
    /* a computed position cannot be checked from the source - say so rather
       than skipping in silence, which is how the oversized row hid */
    if (!isFinite(x) || !isFinite(y)) {
      skip.push(`  ${f}:${line}  ${(lit ? a[0] : str).slice(0, 40)}  at ${a[1]}, ${a[2]}`);
      continue;
    }
    if (!lit) { dyn.push(`  ${f}:${line}  ${str.slice(0, 44)}  x ${x} y ${y} s${s} al${al}`); continue; }
    for (const ch of str.toUpperCase())
      if (!GL.has(ch)) { missing++;
        console.log(`  NO GLYPH   ${f}:${line}  "${str}"  -> '${ch}' draws nothing`); }
    const w = str.length * 4 * s - s, h = 5 * s;
    const x0 = al === 1 ? x - (w / 2 | 0) : al === 2 ? x - w : x;
    if (x0 < 0 || x0 + w > W || y < 0 || y + h > H) { bad++;
      console.log(`  OFF SCREEN  ${f}:${line}  "${str}"  x ${x0}..${x0 + w}  y ${y}..${y + h}`); }
  }
}
console.log(bad ? `\n  ${bad} literal(s) off screen` : '\n  every literal fits the screen');
console.log(missing ? `  ${missing} character(s) with no glyph - they draw nothing`
                    : '  every character has a glyph');
console.log('\n  built at runtime, check the widest case by eye:');
dyn.forEach(d => console.log(d));
console.log('\n  drawn at a computed position, not checkable from source:');
skip.forEach(d => console.log(d));
