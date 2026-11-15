// Cache-busting: coloca ?v=<hash> em todos os scripts, imports e no CSS, para o navegador nunca misturar versões.
// O hash vem do conteúdo: mudou qualquer arquivo de js/ ou o CSS, o número muda em todos.
// Rode depois de editar:   node scripts/versionar.mjs        (com --verificar só confere)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarPaginas } from './paginas.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const verificar = process.argv.includes('--verificar');
const IMPORT = /(from\s+'\.\/[a-z0-9-]+\.js)(\?v=[a-f0-9]+)?(')/g;
const lf = (s) => s.replace(/\r\n/g, '\n');   // o hash não pode depender do tipo de quebra de linha (Windows x Linux)
const sem = (s) => lf(s).replace(IMPORT, '$1$3');

const jsDir = join(raiz, 'js');
const arquivosJs = readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
const css = readFileSync(join(raiz, 'assets/css/setu.css'), 'utf8');
const hash = createHash('sha256');
for (const f of arquivosJs) hash.update(f + sem(readFileSync(join(jsDir, f), 'utf8')));
hash.update(lf(css));
const extras = ['links/links.css', 'links/links.js', 'cadastro/cadastro.css', 'cadastro/cadastro.js'];
for (const e of extras) hash.update(e + lf(readFileSync(join(raiz, e), 'utf8')));
const V = hash.digest('hex').slice(0, 10);

let mudou = 0;
const gravar = (arq, novo, antigo) => { if (novo !== antigo) { mudou++; if (!verificar) writeFileSync(arq, novo); } };

for (const f of arquivosJs) {
  const arq = join(jsDir, f); const s = readFileSync(arq, 'utf8');
  gravar(arq, s.replace(IMPORT, `$1?v=${V}$3`), s);
}
const paginas = listarPaginas(raiz).map((p) => p.arq);
for (const p of paginas) {
  const arq = join(raiz, p); const s = readFileSync(arq, 'utf8');
  // qualquer .js/.css local da página recebe a versão (links externos, como as fontes, ficam de fora)
  const n = s.replace(/((?:src|href)="(?!https?:)[^"]+\.(?:js|css))(\?v=[a-f0-9]+)?(")/g, `$1?v=${V}$3`);
  gravar(arq, n, s);
}
if (verificar) { console.log(mudou ? `Versões desatualizadas em ${mudou} arquivo(s). Rode: node scripts/versionar.mjs` : `Versões em dia (v=${V}).`); process.exit(mudou ? 1 : 0); }
console.log(`Versão ${V} aplicada (${mudou} arquivo(s) alterado(s)).`);
