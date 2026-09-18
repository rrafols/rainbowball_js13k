/* npm run soundtrack: the game's music alone, rendered offline to 16-bit
   44.1 kHz stereo .wav files, one per tune: promo/soundtrack-menu.wav (title
   and desk) and promo/soundtrack-match.wav (the techno). It runs the real
   tracker (src/14_audio.js + src/16_music.js, unpacked, no game around it)
   against an offline audio context whose clock is a frame counter.
   Needs node-web-audio-api (npm i -D node-web-audio-api, or WA=/path/to/its/index.js). */
import { readFileSync, writeFileSync } from 'fs';
const DIR = process.argv[2] || 'promo', SR = 44100, FPS = 60, FADE = 2;
/* [file, st, seconds a step, 32-step bars]. The menu tune is one bar looping; the match is a four-bar turn (lift in bar 2, drop and roll in bar 3) */
const TUNES = [['menu', 'title', .135, 8], ['match', 'play', .105, 16]];

const wa = await import(process.env.WA || 'node-web-audio-api');
let src = readFileSync('src/14_audio.js', 'utf8') + readFileSync('src/16_music.js', 'utf8');
/* SOFT=1: every note in the game starts at full level on its first sample, which is the chip sound but ticks on headphones
   once the mix is normalised; this gives each one a 3 ms attack instead and writes soundtrack-*-soft.wav beside the faithful ones */
const SOFT = process.env.SOFT ? '-soft' : '', was = 'g.gain.setValueAtTime(v, when);';
if (SOFT && !src.includes(was)) { console.error('  16_music.js changed: the attack patch no longer applies'); process.exit(1); }
if (SOFT) src = src.replace(was, 'g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(v, when + .003);');
if (!src.includes("'title depot promo done'.includes(st)")) { console.error('  16_music.js changed: the tune is no longer picked by st'); process.exit(1); }

for (const [name, st, sp, bars] of TUNES) {
  const total = bars * 32, sec = total * sp;                // the clock starts at 0, so step 0 sounds at 0
  const OAC = new wa.OfflineAudioContext(2, SR * (sec + 1) | 0, SR);
  let T = 0;
  const px = new Proxy(OAC, { get: (o, k) => k === 'currentTime' ? T : typeof o[k] === 'function' ? o[k].bind(o) : o[k] });
  const S = new Function('window', 'st', `${src}
    AC = new window.AudioContext();
    return { music, step: () => mstep };`)({ AudioContext: function () { return px; } }, st);
  for (let f = 0; S.step() < total; f++) { T = f / FPS; S.music(); }

  /* the lookahead schedules a few steps past the last bar: cut on the bar line and fade into it */
  const buf = await OAC.startRendering(), n = Math.min(buf.length, sec * SR | 0), L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const wav = Buffer.alloc(44 + n * 4), norm = .89 / peak, fade = i => Math.min(1, (n - i) / (SR * FADE));   // peak at -1 dB
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = norm * fade(i) * 32767; wav.writeInt16LE(L[i] * v | 0, 44 + i * 4); wav.writeInt16LE(R[i] * v | 0, 46 + i * 4); }
  const OUT = DIR + '/soundtrack-' + name + SOFT + '.wav';
  writeFileSync(OUT, wav);
  console.log('  ' + OUT + ': ' + (n / SR).toFixed(1) + 's, peak ' + peak.toFixed(3) + ' before normalising');
}
