/* ---------- 3. sound (3 oscillator blips, no samples) -------- */
let AC = 0, mute = 0;
function snd(f, d, type = 'square', v = .05, f2) {
  if (mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, n);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(.0001, n + d);
    o.connect(g); g.connect(AC.destination); o.start(n); o.stop(n + d + .02);
  } catch (e) {}
}
