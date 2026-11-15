// Valida os dados ANTES de publicar. Roda localmente (node scripts/validar-dados.mjs) e no GitHub Actions.
// Qualquer problema encerra com erro, e o GitHub bloqueia a publicação/merge.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEBHOOK_CADASTRO } from './config.mjs';
import { listarPaginas } from './paginas.mjs';
import { assetSeguro, urlHttps, slugSeguro, TAMANHOS_OK } from '../js/seguranca.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const erros = [];
const erro = (m) => erros.push(m);
const MAX_KB = 700;                       // limite por imagem (evita arquivos gigantes/suspeitos)
const PERIGOSO = /<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link)|javascript:|data:text|on[a-z]+\s*=/i;

const ler = (f) => { try { return JSON.parse(readFileSync(join(raiz, f), 'utf8')); } catch (e) { erro(`${f}: JSON inválido (${e.message})`); return null; } };
const loja = ler('data/loja.json');
const catalogo = ler('data/produtos.json');

function texto(onde, v) { if (typeof v === 'string' && PERIGOSO.test(v)) erro(`${onde}: texto com código suspeito: "${v.slice(0, 60)}"`); }
function varrer(onde, v) { if (typeof v === 'string') texto(onde, v); else if (Array.isArray(v)) v.forEach((x, i) => varrer(`${onde}[${i}]`, x)); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => varrer(`${onde}.${k}`, x)); }

function imagem(onde, p) {
  if (!p) return;
  if (!assetSeguro(p)) return erro(`${onde}: caminho de imagem inválido ou externo: "${p}" (use assets/…/arquivo.webp|jpg|png)`);
  const arq = join(raiz, p);
  if (!existsSync(arq)) return erro(`${onde}: arquivo não existe: ${p}`);
  if (statSync(arq).size > MAX_KB * 1024) erro(`${onde}: imagem maior que ${MAX_KB} KB: ${p}`);
  if (/\.webp$/.test(p) && !/-card\.webp$/.test(p) && onde.startsWith('produto ') && !existsSync(arq.replace(/\.webp$/, '-card.webp'))) erro(`${onde}: falta a versão leve do card de ${p} (rode: python scripts/otimizar_imagens.py)`);
}

if (loja) {
  varrer('loja', loja);
  if (!/^\d{10,15}$/.test(String(loja.whatsapp))) erro('loja.whatsapp: só dígitos com DDI+DDD (ex.: 5547999999999)');
  if (loja.instagram && !urlHttps(loja.instagram, ['instagram.com'])) erro('loja.instagram: precisa ser https://instagram.com/…');
  if (loja.webhookPedidos && !urlHttps(loja.webhookPedidos)) erro('loja.webhookPedidos: precisa ser https://');
  for (const k of ['metaPixelId', 'ga4Id']) if (loja.rastreio?.[k] && !/^[A-Za-z0-9_-]{1,40}$/.test(loja.rastreio[k])) erro(`loja.rastreio.${k}: formato inválido`);
}

if (catalogo) {
  varrer('produtos', catalogo);
  const cols = new Set();
  for (const c of catalogo.colecoes || []) {
    if (!slugSeguro(c.id)) erro(`coleção "${c.id}": id inválido (use minúsculas, números e hífen)`);
    cols.add(c.id); imagem(`coleção ${c.id}.capa`, c.capa);
  }
  const slugs = new Set();
  for (const p of catalogo.produtos || []) {
    const o = `produto ${p.slug}`;
    if (!slugSeguro(p.slug)) erro(`${o}: slug inválido`);
    if (slugs.has(p.slug)) erro(`${o}: slug duplicado`); slugs.add(p.slug);
    if (!cols.has(p.colecao)) erro(`${o}: coleção "${p.colecao}" não existe`);
    if (!(Number(p.preco) > 0 && Number(p.preco) < 100000)) erro(`${o}: preço inválido`);
    for (const c of p.cores || []) {
      if (!slugSeguro(c.id)) erro(`${o}: cor com id inválido "${c.id}"`);
      if (!/^#[0-9a-f]{3,8}$/i.test(c.hex || '')) erro(`${o}/${c.id}: hex inválido "${c.hex}"`);
      imagem(`${o}/${c.id}.capa`, c.capa);
      (c.imagens || []).forEach((im, i) => imagem(`${o}/${c.id}.imagens[${i}]`, im));
      for (const [t, n] of Object.entries(c.grade || {})) {
        if (!TAMANHOS_OK.includes(t)) erro(`${o}/${c.id}: tamanho desconhecido "${t}"`);
        if (!Number.isInteger(n) || n < 0) erro(`${o}/${c.id}: estoque inválido em ${t}`);
      }
    }
  }
}

// O webhook do cadastro precisa ser https e estar liberado no CSP
{
  const cad = readFileSync(join(raiz, 'cadastro/cadastro.js'), 'utf8');
  const m = cad.match(/WEBHOOK_URL\s*=\s*'([^']+)'/);
  if (!m) erro('cadastro.js: WEBHOOK_URL não encontrado');
  else if (!urlHttps(m[1])) erro(`cadastro.js: WEBHOOK_URL precisa ser https:// (${m[1]})`);
  else if (new URL(m[1]).origin !== WEBHOOK_CADASTRO) erro(`cadastro.js: o webhook (${new URL(m[1]).origin}) não está liberado no CSP. Atualize WEBHOOK_CADASTRO em scripts/aplicar-csp.mjs e rode o script.`);
}
if (!/<input[^>]*id="website"/.test(readFileSync(join(raiz, 'cadastro/index.html'), 'utf8'))) erro('cadastro/index.html: campo-isca anti-robô (id="website") foi removido');

// Nada executável dentro de assets/ (só imagens, fontes e CSS)
const OK_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png', '.svg', '.ico', '.css']);
(function varrerAssets(dir) {
  for (const n of readdirSync(dir)) {
    const f = join(dir, n);
    if (statSync(f).isDirectory()) varrerAssets(f);
    else if (!OK_EXT.has(extname(n).toLowerCase())) erro(`assets: tipo de arquivo não permitido: ${f.replace(raiz, '')}`);
  }
})(join(raiz, 'assets'));

// Páginas: nada carregado de fora (só fontes), nada de código embutido, SEO coerente
const PAGINAS = listarPaginas(raiz).map((p) => p.arq);
const DOMINIO = (() => { try { return new URL(loja?.dominio).origin; } catch { return ''; } })();
if (!DOMINIO) erro('loja.dominio: precisa ser https://seudominio.com.br');
const FONTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const LINKS_OK = [DOMINIO && new URL(DOMINIO).hostname, 'api.whatsapp.com', 'instagram.com'].filter(Boolean);
const host = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
for (const p of PAGINAS) {
  const html = readFileSync(join(raiz, p), 'utf8');
  if (!html.includes('Content-Security-Policy')) erro(`${p}: sem Content-Security-Policy (rode node scripts/aplicar-csp.mjs)`);
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    if (/\bsrc=/.test(m[1]) || /type="application\/ld\+json"/.test(m[1])) continue;
    erro(`${p}: script inline (o CSP bloqueia; mova para js/)`);
  }
  if (/<style[\s>]/i.test(html)) erro(`${p}: bloco <style> inline (o CSP bloqueia; mova para um .css)`);
  if (/\son[a-z]+\s*=/i.test(html)) erro(`${p}: atributo de evento inline (onclick/onerror…)`);
  // recursos carregados: nenhum de fora
  for (const m of html.matchAll(/<(?:script|img|iframe|source|video|audio|embed)\b[^>]*\bsrc="(https?:[^"]+)"/gi)) erro(`${p}: recurso externo não permitido: ${m[1]}`);
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = m[0].match(/\bhref="(https?:[^"]+)"/)?.[1]; if (!href) continue;
    const rel = m[0].match(/\brel="([^"]+)"/)?.[1] || '';
    const ok = FONTES.includes(host(href)) || (/^(canonical|alternate)$/.test(rel) && host(href) === new URL(DOMINIO || 'https://x.invalid').hostname);
    if (!ok) erro(`${p}: <link> externo não permitido: ${href}`);
  }
  // links de navegação: só https e hosts conhecidos
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https?:[^"]+)"/gi)) {
    const u = m[1].replace(/&amp;/g, '&');
    if (!u.startsWith('https://') || !LINKS_OK.some((h) => host(u) === h || host(u).endsWith(`.${h}`))) erro(`${p}: link para host não permitido: ${u.slice(0, 80)}`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { erro(`${p}: JSON-LD inválido`); } }
  // SEO: página indexável precisa de canonical do domínio, título, descrição e imagem de compartilhamento existente
  const indexavel = /<meta name="robots" content="index/.test(html);
  if (indexavel) {
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canon || !canon.startsWith(`${DOMINIO}/`)) erro(`${p}: canonical ausente ou fora do domínio`);
    const t = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
    if (t.length < 15 || t.length > 75) erro(`${p}: título com ${t.length} caracteres (ideal de 30 a 65)`);
    const d = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
    if (d.length < 70 || d.length > 175) erro(`${p}: meta description com ${d.length} caracteres (ideal de 90 a 160)`);
    const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    if (!og || !og.startsWith(`${DOMINIO}/`) || !existsSync(join(raiz, og.slice(DOMINIO.length + 1)))) erro(`${p}: og:image ausente ou arquivo inexistente (${og})`);
    if ((html.match(/<h1[\s>]/g) || []).length !== 1 && !/id="(produto|principal)"/.test(html)) erro(`${p}: precisa de exatamente um <h1>`);
  } else if (!/<meta name="robots" content="noindex/.test(html)) erro(`${p}: sem <meta name="robots"> (rode node scripts/gerar-paginas.mjs)`);
}
// sitemap e robots
if (!existsSync(join(raiz, 'robots.txt'))) erro('robots.txt ausente');
if (!existsSync(join(raiz, 'sitemap.xml'))) erro('sitemap.xml ausente');
else {
  const sm = readFileSync(join(raiz, 'sitemap.xml'), 'utf8');
  for (const p of PAGINAS.filter((x) => /^(produto|colecao)\/[^/]+\/index\.html$/.test(x))) {
    if (!sm.includes(`<loc>${DOMINIO}/${p.replace('index.html', '')}</loc>`)) erro(`sitemap.xml: falta ${p}`);
  }
}

if (erros.length) { console.error(`\n${erros.length} problema(s) encontrado(s):\n` + erros.map((e) => ` ✗ ${e}`).join('\n')); process.exit(1); }
console.log('Dados válidos: nenhum problema encontrado.');
