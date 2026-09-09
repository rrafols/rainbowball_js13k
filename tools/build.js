/* Build chain: concat src/*.js in filename order -> Terser -> (optional)
   Roadroller -> inline into the HTML shell -> zip -> report against 13,312.  */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { minify } from 'terser';

const BUDGET = 13312;
const args = process.argv.slice(2);
const useRR = args.includes('--roadroller');
const report = args.includes('--report');
const test = args.includes('--test');   // exposes a handle for tools/smoke.js
const reopt = args.includes('--reopt'); // re-run Roadroller's randomised search and print what it found

const files = readdirSync('src').filter(f => f.endsWith('.js')).sort();
const parts = files.map(f => ({ f, src: readFileSync('src/' + f, 'utf8') }));
let source = parts.map(p => p.src).join('\n');
if (test) source += `
;globalThis.__g = { menu, tick, render, buy,
  get st(){return st}, set st(v){st=v}, get sc(){return sc}, get squad(){return squad},
  get clock(){return clock}, set clock(v){clock=v}, get money(){return money}, set money(v){money=v},
  get div(){return div}, set div(v){div=v}, get pl(){return pl}, get bank(){return bank}, get ball(){return ball}, get AR(){return AR}, newMatch,
  get cam(){return cam}, get camX(){return camX}, boom, ring, puff, set fx(v){fx=v}, get GX0(){return GX0}, get GX1(){return GX1},
  set mIn(v){mIn=v}, set sd(v){sd=v}, get bows(){return bows},
  nav, subIn, doAct, get mi(){return mi}, set mi(v){mi=v}, get sel(){return sel}, set sel(v){sel=v},
  set skipT(v){tutSeen=v}, set touch(v){touch=v}, set tipI(v){tipI=v}, set specT(v){specT=v}, set specTeam(v){specTeam=v}, set sweep(v){sweep=v}, bigUnicorn, txt, X,   /* harnesses still say g.skipT = 1 */ set lit(v){lit=v},
  get achG(){return achG}, set achG(v){achG=v}, ach };`;

const min = await minify(source, {
  ecma: 2020,
  compress: { passes: 4, unsafe: true, unsafe_arrows: true, unsafe_math: true,
              unsafe_comps: true, unsafe_methods: true, booleans_as_integers: true,
              drop_console: true, pure_getters: true, toplevel: true },
  mangle: { toplevel: true },
  format: { comments: false }
});
if (min.error) { console.error(min.error); process.exit(1); }
let code = min.code;

if (useRR) {
  /* Roadroller's optimize(2) is a randomised search that varies 10-20 B run to
     run. The parameters it converged on (best of four) are frozen in
     tools/heatmap-params.json, so the
     build is deterministic and lands on the best set found, not an average one.
     --reopt runs the search again and prints the result for freezing by hand.
     allowFreeVars lets the decoder use bare globals for a smaller decoder; it
     is safe only because no element has a single-letter id (the canvas is
     `cv`, not `c` - see 00_boot.js). */
  const { Packer } = await import('roadroller');
  const RR = JSON.parse(readFileSync('tools/heatmap-params.json', 'utf8')).options;
  const packer = new Packer([{ data: code, type: 'js', action: 'eval' }],
                            reopt ? { allowFreeVars: true } : { ...RR, allowFreeVars: true });
  if (reopt) { const r = await packer.optimize(2); console.log('  optimize(2) found', JSON.stringify(r.best)); }
  code = packer.makeDecoder().firstLine + packer.makeDecoder().secondLine;
}

mkdirSync('dist', { recursive: true });
const html = readFileSync('src/index.html', 'utf8').replace('/*GAME*/', () => code);
writeFileSync('dist/index.html', html);

let zipper = 'none';                      // which tool made dist/game.zip; printed in the report
try {
  execSync('cd dist && rm -f game.zip && zip -qX9 game.zip index.html');
  zipper = 'zip -9';
  /* advzip is zopfli: deterministic, ~430 B better than zip -9, and unlike
     packer.optimize() it adds no run-to-run variance. Inner try so a missing
     advzip does not print the misleading "no zip binary" message below. */
  try { execSync('advzip -z -4 -i 500 -q dist/game.zip'); zipper = 'advzip (zopfli)'; }
  catch { console.log('  (no advzip; brew install advancecomp for ~430 B less)'); }
}
catch { console.log('  (no zip binary; install zip for a real size figure)'); }

writeFileSync('dist/game.min.js', min.code);
const raw = source.length, minified = code.length;
const zipped = existsSync('dist/game.zip') ? statSync('dist/game.zip').size : 0;
const pct = n => (n / BUDGET * 100).toFixed(1) + '%';

console.log('\n  RAINBOWBALL 2 build' + (useRR ? '  [roadroller]' : ''));
console.log('  ' + '-'.repeat(46));
if (report) {
  const total = parts.reduce((a, p) => a + p.src.length, 0);
  for (const p of parts)
    console.log('  ' + p.f.padEnd(20) + String(p.src.length).padStart(7) + ' B  ' +
                (p.src.length / total * 100).toFixed(1).padStart(5) + '%');
  console.log('  ' + '-'.repeat(46));
}
console.log('  source   ' + String(raw).padStart(7) + ' B');
console.log('  minified ' + String(minified).padStart(7) + ' B');
console.log('  zipped   ' + String(zipped).padStart(7) + ' B   ' + pct(zipped) + ' of 13,312');
console.log('  packed with ' + zipper + (zipper === 'zip -9' ? '  <- NOT the competition figure, advzip is ~430 B smaller' : ''));
console.log('  ' + (zipped <= BUDGET
  ? 'UNDER BUDGET by ' + (BUDGET - zipped) + ' B'
  : 'OVER BUDGET by ' + (zipped - BUDGET) + ' B'));
console.log('');
