/* Writes dev.html: every module as its own <script> in order, no bundler.
   Top-level let/const are shared across classic scripts, so this behaves
   exactly like the concatenated build - but breakpoints land in real files. */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
const files = readdirSync('src').filter(f => f.endsWith('.js')).sort();
const tags = files.map(f => `<script src="src/${f}"></script>`).join('\n');
writeFileSync('dev.html', readFileSync('src/index.html', 'utf8')
  .replace('<script>/*GAME*/</script>', tags)
  .replace('<title>RAINBOWBALL 2</title>', '<title>RAINBOWBALL 2 [dev]</title>'));
console.log('dev.html written with ' + files.length + ' modules');
