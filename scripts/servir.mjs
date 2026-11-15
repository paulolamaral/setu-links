// Servidor local que se comporta como o GitHub Pages: pasta → index.html e, se não achar, entrega o 404.html (status 404).
// Uso:  node scripts/servir.mjs [porta]      (padrão 8123)  →  http://localhost:8123
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const porta = Number(process.argv[2]) || 8123;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };

async function arquivoPara(caminho) {
  let rel = normalize(decodeURIComponent(caminho));
  while (rel.startsWith('/') || rel.startsWith(sep)) rel = rel.slice(1);
  const base = raiz.endsWith(sep) ? raiz.slice(0, -1) : raiz;
  const abs = join(base, rel);
  if (abs !== base && !abs.startsWith(base + sep)) return null;                               // fora da pasta do site
  if (rel.split(sep).some((p) => p.startsWith('.') && p !== '.nojekyll')) return null;       // .git etc. nunca são servidos
  try {
    const s = await stat(abs);
    if (s.isDirectory()) { const idx = join(abs, 'index.html'); await stat(idx); return { dir: idx }; }
    return abs;
  } catch { return null; }
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    let arq = await arquivoPara(pathname);
    let status = 200;
    // como o GitHub Pages: /pasta vira /pasta/ (senão os caminhos relativos da página quebram)
    if (arq && typeof arq === 'object') {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + (new URL(req.url, 'http://x').search || '') }); res.end(); return; }
      arq = arq.dir;
    }
    if (!arq) { arq = join(raiz, '404.html'); status = 404; }
    const corpo = await readFile(arq);
    res.writeHead(status, { 'Content-Type': TIPOS[extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(corpo);
  } catch (e) { res.writeHead(500); res.end('erro'); }
}).listen(porta, () => console.log(`Site em http://localhost:${porta}  (Ctrl+C para parar)`));
