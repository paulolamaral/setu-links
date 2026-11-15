// Gera a Política de Segurança de Conteúdo (CSP) a partir de data/loja.json e grava em todas as páginas.
// Rode depois de mudar webhook, Pixel ou GA4:   node scripts/aplicar-csp.mjs
// Com --verificar apenas confere se as páginas estão em dia (usado no GitHub Actions).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listarPaginas } from './paginas.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const loja = JSON.parse(readFileSync(join(raiz, 'data/loja.json'), 'utf8'));
const verificar = process.argv.includes('--verificar');

const origem = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.origin : ''; } catch { return ''; } };
const script = ['\'self\''];
const conectar = ['\'self\''];
const imagens = ['\'self\'', 'data:'];
if (loja.rastreio?.metaPixelId) { script.push('https://connect.facebook.net'); conectar.push('https://www.facebook.com', 'https://connect.facebook.net'); imagens.push('https://www.facebook.com'); }
if (loja.rastreio?.ga4Id) { script.push('https://www.googletagmanager.com'); conectar.push('https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://www.googletagmanager.com'); imagens.push('https://www.google-analytics.com', 'https://www.googletagmanager.com'); }
const hook = origem(loja.webhookPedidos); if (hook) conectar.push(hook);

// Páginas e o que cada uma pode, além do básico. O cadastro envia o formulário para o webhook do evento.
const paginas = listarPaginas(raiz);

function politica(p) {
  // links/ e cadastro/ não usam loja.json: não herdam Pixel/GA4/webhook de pedidos
  const sc = p.loja === false ? ["'self'"] : script;
  const cn = p.loja === false ? ["'self'", ...(p.conectar || [])] : conectar;
  const im = p.loja === false ? ["'self'", 'data:'] : imagens;
  return [
    `default-src 'self'`,
    `script-src ${sc.join(' ')}`,
    `style-src 'self' https://fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `font-src https://fonts.gstatic.com`,
    `img-src ${im.join(' ')}`,
    `connect-src ${cn.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

const blocoDe = (p) => `<meta http-equiv="Content-Security-Policy" content="${politica(p)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
`;
const RE = /<meta http-equiv="Content-Security-Policy"[^>]*>\n?(<meta name="referrer"[^>]*>\n?)?/;

let desatualizadas = 0;
for (const pg of paginas) {
  const p = pg.arq; const bloco = blocoDe(pg);
  const arq = join(raiz, p);
  const html = readFileSync(arq, 'utf8');
  const novo = RE.test(html) ? html.replace(RE, bloco) : html.replace(/(<meta charset="UTF-8">\n)/, `$1${bloco}`);
  if (novo !== html) { desatualizadas++; if (!verificar) writeFileSync(arq, novo); }
}
if (verificar) { console.log(desatualizadas ? `CSP desatualizado em ${desatualizadas} página(s). Rode: node scripts/aplicar-csp.mjs` : 'CSP em dia.'); process.exit(desatualizadas ? 1 : 0); }
console.log(`CSP aplicado em ${paginas.length} páginas (${desatualizadas} alteradas).`);
