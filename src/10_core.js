/* ---------- 1. micro helpers -------------------------------- */
const C = (h, l = 60, s = 90, a = 1) => `hsla(${h|0},${s}%,${l}%,${a})`;
const R = (x, y, w, h, c) => { X.fillStyle = c; X.fillRect(x | 0, y | 0, w, h); };
const PI = Math.PI, sin = Math.sin, cos = Math.cos, atan2 = Math.atan2;
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let seed = 1337;
const rs = () => (seed = seed * 16807 % 2147483647) / 2147483647;   // tiny PRNG
const pick = a => a[rs() * a.length | 0];
