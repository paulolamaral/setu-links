// Gera as páginas que os buscadores e o WhatsApp precisam enxergar sem executar JavaScript:
//   produto/<slug>/index.html, colecao/<id>/index.html, bloco de SEO (canonical, Open Graph, JSON-LD) de TODAS as páginas,
//   o FAQ da home, sitemap.xml e robots.txt.
// Fonte única: data/loja.json e data/produtos.json.   Rodar:  node scripts/gerar-paginas.mjs   (--verificar só confere)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const verificar = process.argv.includes('--verificar');
const loja = JSON.parse(readFileSync(join(raiz, 'data/loja.json'), 'utf8'));
const dados = JSON.parse(readFileSync(join(raiz, 'data/produtos.json'), 'utf8'));
const DOM = String(loja.dominio || '').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+$/i.test(DOM)) { console.error('data/loja.json: "dominio" precisa ser https://seudominio.com.br'); process.exit(1); }

const produtos = (dados.produtos || []).filter((p) => p.ativo !== false);
const colecoes = [...(dados.colecoes || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
const colDe = (id) => colecoes.find((c) => c.id === id);
const abs = (p) => `${DOM}/${String(p).replace(/^\//, '')}`;
const A = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');   // atributo/texto HTML
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');       // JSON-LD sem quebrar </script>
const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v).replace(/\u00a0/g, ' ');
const cortar = (t, max) => { t = String(t).replace(/\s+/g, ' ').trim(); if (t.length <= max) return t; const c = t.slice(0, max - 1); return c.slice(0, c.lastIndexOf(' ')) + '…'; };
const esgotado = (p) => !(p.cores || []).some((c) => Object.values(c.grade || {}).some((n) => n > 0));
const imagensDe = (p) => [...new Set((p.cores || []).flatMap((c) => c.imagens || []))];
const zapTel = `+${String(loja.whatsapp).replace(/\D/g, '')}`;

const divergentes = [];
function escreve(rel, conteudo) {
  const arq = join(raiz, rel);
  const atual = existsSync(arq) ? readFileSync(arq, 'utf8') : null;
  if (atual === conteudo) return;
  divergentes.push(rel);
  if (!verificar) { mkdirSync(dirname(arq), { recursive: true }); writeFileSync(arq, conteudo); }
}

// ---------- bloco de SEO ----------
function blocoSeo({ url, titulo, descricao, robots = 'index,follow,max-image-preview:large', og, ogAlt, tipo = 'website', jsonld = [], extra = '' }) {
  const linhas = [`<meta name="robots" content="${robots}">`];
  if (!robots.startsWith('noindex')) {
    linhas.push(
      `<link rel="canonical" href="${A(url)}">`,
      `<meta property="og:type" content="${tipo}">`,
      `<meta property="og:site_name" content="${A(loja.marca)}">`,
      `<meta property="og:locale" content="pt_BR">`,
      `<meta property="og:title" content="${A(titulo)}">`,
      `<meta property="og:description" content="${A(descricao)}">`,
      `<meta property="og:url" content="${A(url)}">`,
      `<meta property="og:image" content="${A(og)}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:alt" content="${A(ogAlt || titulo)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${A(titulo)}">`,
      `<meta name="twitter:description" content="${A(descricao)}">`,
      `<meta name="twitter:image" content="${A(og)}">`,
    );
    if (extra) linhas.push(extra);
    for (const j of jsonld) linhas.push(`<script type="application/ld+json">${json(j)}</script>`);
  }
  return `<!--seo-->\n${linhas.join('\n')}\n<!--/seo-->`;
}
const trocaSeo = (html, bloco) => html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, () => bloco);
const trocaTitulo = (html, t) => html.replace(/<title>[^<]*<\/title>/, () => `<title>${A(t)}</title>`);
const trocaDesc = (html, d) => (/<meta name="description"/.test(html)
  ? html.replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${A(d)}">`)
  : html.replace('<!--/seo-->', () => `<meta name="description" content="${A(d)}">\n<!--/seo-->`));
const lerPagina = (rel) => readFileSync(join(raiz, rel), 'utf8');
const tituloDe = (html) => (html.match(/<title>([^<]*)<\/title>/)?.[1] || '').replace(/&amp;/g, '&');
const descDe = (html) => (html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '').replace(/&amp;/g, '&');

const migalhas = (itens) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: itens.map(([nome, url], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: url })) });

const organizacao = () => ({ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${DOM}/#marca`, name: loja.marca, url: `${DOM}/`,
  logo: abs('assets/apple-touch-icon.png'), description: 'Camisetas cristãs em edição limitada. Streetwear com propósito.',
  sameAs: [loja.instagram].filter(Boolean),
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: zapTel, availableLanguage: 'pt-BR' }] });

// ---------- páginas estáticas ----------
function estatica(rel, cfg) {
  let html = lerPagina(rel);
  const titulo = tituloDe(html), descricao = descDe(html);
  html = trocaSeo(html, blocoSeo({ titulo, descricao, ...cfg(titulo, descricao) }));
  return html;
}

const faqHtml = () => {
  const itens = (loja.faq || []).map((q) => `      <details class="faq-item"><summary>${A(q.p)}</summary><p>${A(q.r)}</p></details>`).join('\n');
  return `<!--faq-->\n  <section class="secao faq" id="duvidas">\n    <div class="wrap">\n      <div class="secao-topo"><div><p class="eyebrow">dúvidas</p><h2>Perguntas frequentes</h2></div></div>\n      <div class="faq-lista">\n${itens}\n      </div>\n    </div>\n  </section>\n<!--/faq-->`;
};
const faqJson = () => ({ '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: (loja.faq || []).map((q) => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })) });

let home = estatica('index.html', (t, d) => ({
  url: `${DOM}/`, og: abs('assets/og/home.jpg'), ogAlt: 'Casal vestindo camisetas cristãs da Sê Tu',
  jsonld: [organizacao(), { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${DOM}/#site`, url: `${DOM}/`, name: loja.marca, inLanguage: 'pt-BR', publisher: { '@id': `${DOM}/#marca` } }, ...(loja.faq?.length ? [faqJson()] : [])],
}));
if (loja.faq?.length) home = home.replace(/<!--faq-->[\s\S]*?<!--\/faq-->/, () => faqHtml());
escreve('index.html', home);

escreve('sobre/index.html', estatica('sobre/index.html', (t, d) => ({
  url: `${DOM}/sobre/`, og: abs('assets/og/home.jpg'), ogAlt: 'Sê Tu, camisetas cristãs',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'AboutPage', url: `${DOM}/sobre/`, name: t, description: d, inLanguage: 'pt-BR', about: { '@id': `${DOM}/#marca` } },
    migalhas([['Início', `${DOM}/`], ['Sobre', `${DOM}/sobre/`]]), organizacao()],
})));
for (const rel of ['404.html', 'sacola/index.html', 'links/index.html', 'cadastro/index.html']) escreve(rel, estatica(rel, () => ({ robots: 'noindex,nofollow' })));
for (const rel of ['colecao/index.html', 'produto/index.html']) escreve(rel, estatica(rel, () => ({ robots: 'noindex,follow' })));

// ---------- produto/<slug>/ ----------
const moldeProduto = lerPagina('produto/index.html'), moldeColecao = lerPagina('colecao/index.html');
const noOutroNivel = (html) => html.replace(/\b(src|href)="\.\.\//g, '$1="../../');

for (const p of produtos) {
  const url = abs(`produto/${p.slug}/`);
  const col = colDe(p.colecao);
  const publico = p.publico === 'feminino' ? 'feminina' : p.publico === 'masculino' ? 'masculina' : 'unissex';
  const modelo = p.modelagem === 'oversize' ? ' oversize' : '';
  const tCompleto = `${p.nome} | Camiseta cristã ${publico}${modelo} — ${loja.marca}`;
  const titulo = tCompleto.length <= 64 ? tCompleto : `${p.nome} | ${loja.marca}`;
  const descricao = cortar(`${p.nome}: camiseta cristã ${publico}${modelo} por ${brl(p.preco)}, edição limitada. ${p.descricao} Peça pelo WhatsApp.`, 158);
  const imagens = imagensDe(p).slice(0, 8).map(abs);
  const oferta = { '@type': 'Offer', url, priceCurrency: 'BRL', price: Number(p.preco).toFixed(2),
    availability: esgotado(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${DOM}/#marca` } };
  const produtoLd = { '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#produto`, name: p.nome, description: p.descricao, sku: p.slug,
    url, image: imagens.length ? imagens : [abs(`assets/og/${p.slug}.jpg`)], brand: { '@type': 'Brand', name: loja.marca }, category: 'Camisetas',
    ...(p.modelagem ? { additionalProperty: [{ '@type': 'PropertyValue', name: 'Modelagem', value: p.modelagem }] } : {}),
    color: (p.cores || []).map((c) => c.nome).join(', '), audience: { '@type': 'PeopleAudience', suggestedGender: p.publico === 'feminino' ? 'female' : p.publico === 'masculino' ? 'male' : 'unisex' },
    offers: oferta };
  const crumbs = [['Início', `${DOM}/`], ...(col ? [[col.nome, abs(`colecao/${col.id}/`)]] : []), [p.nome, url]];
  const seo = blocoSeo({ url, titulo, descricao, og: abs(`assets/og/${p.slug}.jpg`), ogAlt: `${p.nome}, camiseta cristã ${publico}${modelo}`, tipo: 'product',
    extra: `<meta property="product:price:amount" content="${Number(p.preco).toFixed(2)}">\n<meta property="product:price:currency" content="BRL">`,
    jsonld: [produtoLd, migalhas(crumbs)] });
  let html = trocaDesc(trocaTitulo(trocaSeo(noOutroNivel(moldeProduto), seo), titulo), descricao);
  const zap = `https://api.whatsapp.com/send?phone=${String(loja.whatsapp).replace(/\D/g, '')}&text=${encodeURIComponent(`Oi, Sê Tu! Tenho uma dúvida sobre "${p.nome}".`)}`;
  const semJs = `<noscript><h1>${A(p.nome)}</h1><p>${A(p.descricao)}</p><p>${brl(p.preco)} · Camiseta cristã ${publico} · edição limitada</p><p><a href="${A(zap)}">Pedir pelo WhatsApp</a></p></noscript>`;
  html = html.replace(/<div class="wrap" id="produto">/, () => `<div class="wrap" id="produto" data-slug="${A(p.slug)}">${semJs}`);
  escreve(`produto/${p.slug}/index.html`, html);
}

// ---------- colecao/<id>/ ----------
for (const c of colecoes) {
  if (c.status === 'em-breve') continue;
  const url = abs(`colecao/${c.id}/`);
  const lista = produtos.filter((p) => p.colecao === c.id);
  const titulo = cortar(`${c.nome} | Camisetas cristãs — ${loja.marca}`, 64);
  const descricao = cortar(`${c.descricao} ${lista.length} ${lista.length === 1 ? 'camiseta cristã' : 'camisetas cristãs'} em edição limitada. Peça direto pelo WhatsApp.`, 158);
  const seo = blocoSeo({ url, titulo, descricao, og: abs(`assets/og/colecao-${c.id}.jpg`), ogAlt: `Coleção ${c.nome}`,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', url, name: c.nome, description: c.descricao, inLanguage: 'pt-BR',
      mainEntity: { '@type': 'ItemList', itemListElement: lista.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`produto/${p.slug}/`), name: p.nome })) } },
    migalhas([['Início', `${DOM}/`], [c.nome, url]])] });
  let html = trocaDesc(trocaTitulo(trocaSeo(noOutroNivel(moldeColecao), seo), titulo), descricao);
  const topo = `<div class="col-topo" id="colecao-topo" data-colecao="${A(c.id)}"><p class="eyebrow">coleção</p><h1>${A(c.nome)}</h1><p class="lead-col">${A(c.descricao)}</p></div>`;
  html = html.replace(/<div class="col-topo" id="colecao-topo"><\/div>/, () => topo);
  const links = lista.map((p) => `<li><a href="${A(abs(`produto/${p.slug}/`))}">${A(p.nome)}</a></li>`).join('');
  html = html.replace(/(<div class="grade" id="colecao-grade">)/, (m) => `${m}<noscript><ul>${links}</ul></noscript>`);
  escreve(`colecao/${c.id}/index.html`, html);
}

// ---------- remove páginas de itens que não existem mais ----------
for (const [dir, ids] of [['produto', new Set(produtos.map((p) => p.slug))], ['colecao', new Set(colecoes.filter((c) => c.status !== 'em-breve').map((c) => c.id))]]) {
  const base = join(raiz, dir);
  for (const n of readdirSync(base)) {
    if (statSync(join(base, n)).isDirectory() && !ids.has(n)) { divergentes.push(`${dir}/${n}/ (removida)`); if (!verificar) rmSync(join(base, n), { recursive: true }); }
  }
}

// ---------- sitemap.xml e robots.txt ----------
const url = (loc, prio, imgs = []) => `  <url>\n    <loc>${A(loc)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${prio}</priority>\n${imgs.map((i) => `    <image:image><image:loc>${A(abs(i.src))}</image:loc><image:title>${A(i.titulo)}</image:title></image:image>`).join('\n')}${imgs.length ? '\n' : ''}  </url>`;
const urls = [url(`${DOM}/`, '1.0'), url(`${DOM}/sobre/`, '0.6'),
  ...colecoes.filter((c) => c.status !== 'em-breve').map((c) => url(abs(`colecao/${c.id}/`), '0.8')),
  ...produtos.map((p) => url(abs(`produto/${p.slug}/`), '0.9', imagensDe(p).slice(0, 5).map((src) => ({ src, titulo: `${p.nome}, camiseta cristã` }))))];
escreve('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);
escreve('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${DOM}/sitemap.xml\n`);

if (verificar) { console.log(divergentes.length ? `SEO desatualizado em: ${divergentes.join(', ')}\nRode: node scripts/gerar-paginas.mjs` : 'Páginas e SEO em dia.'); process.exit(divergentes.length ? 1 : 0); }
console.log(`Geradas/atualizadas ${divergentes.length} página(s) e arquivos de SEO.`);
