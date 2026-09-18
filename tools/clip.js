/* Shared by tools/video.js and tools/trailer.js: boots the packed --test build
   under node-canvas with an offline audio context whose clock is the frame
   counter, and streams frames to ffmpeg. Audio needs node-web-audio-api
   (npm i -D node-web-audio-api, or WA=/path/to/its/index.js); without it the
   clip is silent. ffmpeg must be on PATH (FFMPEG=/path overrides).        */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { createCanvas } from 'canvas';
export const SR = 44100, FPS = 60;
/* boot: W x H is the game's virtual resolution, sec the longest clip the audio must hold */
export async function boot(W, H, sec, extra = {}) {
  const cv = createCanvas(W, H), EV = {};
  global.document = { getElementById: () => cv, querySelector: () => cv, createElement: () => createCanvas(24, 24) };
  global.window = {}; global.addEventListener = (e, f) => EV[e] = f; global.requestAnimationFrame = () => {};
  global.innerWidth = 1280; global.innerHeight = 720; global.localStorage = {}; global.performance = { now: () => 0 };
  cv.addEventListener = () => {}; cv.setPointerCapture = () => {}; cv.style = {};
  cv.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H });
  Object.assign(global, extra);
  const audio = { t: 0, live: 1, OAC: 0 };
  global.window.AudioContext = function () { throw 0; };
  try {
    const wa = await import(process.env.WA || 'node-web-audio-api');
    audio.OAC = new wa.OfflineAudioContext(2, SR * (sec + 1), SR);
    const px = new Proxy(audio.OAC, { get: (o, k) => k === 'currentTime' ? audio.t : typeof o[k] === 'function' ? o[k].bind(o) : o[k] });
    global.window.AudioContext = function () { if (!audio.live) throw 0; return px; };
  } catch (e) { console.log('  no node-web-audio-api: the clip will be silent (' + e.message + ')'); }
  const html = readFileSync('dist/index.html', 'utf8');
  (0, eval)(html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>')));
  const g = globalThis.__g;
  if (!g) { console.error('  build was not made with --test'); process.exit(1); }
  const held = {};
  const key = (k, on) => { if (!!held[k] === !!on) return; held[k] = !!on; EV[on ? 'keydown' : 'keyup']({ key: k, preventDefault() {}, repeat: 0 }); };
  return { g, cv, X: cv.getContext('2d'), audio, key, release: () => Object.keys(held).forEach(k => key(k, 0)), W, H };
}
/* a recording: frame() after every render, finish() muxes the audio the game scheduled meanwhile */
export class Rec {
  constructor(cv, out, scale, audio) {
    this.cv = cv; this.out = out; this.audio = audio; this.n = 0; this.gain = [];
    this.tmp = out + '.video.mp4';
    this.ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', cv.width + 'x' + cv.height, '-r', '' + FPS, '-i', '-',
      '-vf', `scale=${cv.width * scale}:${cv.height * scale}:flags=neighbor`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', this.tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  frame(vol = 1) {                                  // vol: the audio level for this frame (fades at cuts)
    this.audio.t = this.n++ / FPS; this.gain.push(vol);
    const b = this.cv.toBuffer('raw');
    return new Promise(r => this.ff.stdin.write(b) ? r() : this.ff.stdin.once('drain', r));
  }
  async finish() {
    this.ff.stdin.end(); await new Promise(r => this.ff.on('close', r));
    const OAC = this.audio.OAC;
    if (!OAC) { spawn('mv', [this.tmp, this.out]); console.log('  ' + this.out + ' (silent)'); return; }
    const buf = await OAC.startRendering(), n = Math.min(buf.length, this.n / FPS * SR | 0), wav = Buffer.alloc(44 + n * 4), L = buf.getChannelData(0), R = buf.getChannelData(1), G = this.gain;
    wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
    wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) {
      const f = i / SR * FPS, j = f | 0, v = (G[j] ?? 1) + ((G[j + 1] ?? G[j] ?? 1) - (G[j] ?? 1)) * (f - j);
      wav.writeInt16LE(Math.max(-1, Math.min(1, L[i] * v)) * 32767 | 0, 44 + i * 4); wav.writeInt16LE(Math.max(-1, Math.min(1, R[i] * v)) * 32767 | 0, 46 + i * 4);
    }
    const WAV = this.out + '.wav'; writeFileSync(WAV, wav);
    const mux = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', this.tmp, '-i', WAV, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-14:TP=-1', '-shortest', '-movflags', '+faststart', this.out], { stdio: 'inherit' });
    await new Promise(r => mux.on('close', r));
    unlinkSync(this.tmp); unlinkSync(WAV); console.log('  ' + this.out);
  }
}
