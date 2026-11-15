import { brl, carregarJSON, esc, RAIZ, url } from './util.js?v=5ab12daffd';
import { sanitizarCatalogo } from './seguranca.js?v=5ab12daffd';

export const TAMANHOS = ['P', 'M', 'G', 'GG', 'G1'];

let _cache;
export async function carregarCatalogo() {
  if (!_cache) {
    const d = sanitizarCatalogo(await carregarJSON(url('data/produtos.json')));
    _cache = { colecoes: d.colecoes, produtos: d.produtos.filter((p) => p.ativo !== false) };
  }
  return _cache;
}

export const estoqueCor = (cor) => Object.values(cor.grade || {}).reduce((a, n) => a + (n || 0), 0);
export const esgotado = (p) => !(p.cores || []).some((c) => estoqueCor(c) > 0);

/** Fotos da cor; se a cor ainda não tem foto, usa as da primeira cor que tiver. */
export function imagensDaCor(p, cor) {
  if (cor?.imagens?.length) return cor.imagens;
  const outra = (p.cores || []).find((c) => c.imagens?.length);
  return outra ? outra.imagens : [];
}

export function fotosCard(p) {
  const c = p.cores?.[0];
  const imgs = imagensDaCor(p, c);
  const capa = (c?.imagens?.length && c.capa) || imgs[0];
  return [capa, imgs.find((x) => x !== capa)];
}

export const versaoCard = (src) => (src && /\.webp$/.test(src) && !/-card\.webp$/.test(src) ? src.replace(/\.webp$/, '-card.webp') : src);

/** prioritario === true: fotos acima da dobra carregam já (sem lazy), para o LCP. */
export function cardProduto(p, prioritario) {
  const prio = prioritario === true;
  const [a, b] = fotosCard(p);
  const sold = esgotado(p);
  const poucas = !sold && (p.cores || []).some((c) => Object.values(c.grade || {}).some((n) => n > 0 && n <= 2));
  const selo = sold ? 'esgotado' : poucas ? 'últimas unidades' : '';
  const pontos = (p.cores || []).length > 1
    ? `<span class="pontos" aria-label="${p.cores.length} cores">${p.cores.map((c) => `<i style="--c:${esc(c.hex || '#999')}" title="${esc(c.nome)}"></i>`).join('')}</span>`
    : '';
  return `<a class="card" href="${RAIZ}produto/${encodeURIComponent(p.slug)}/" data-publico="${esc(p.publico)}">
    <div class="card-img"${b ? ` data-alt="${RAIZ}${esc(versaoCard(b))}"` : ''}>
      ${selo ? `<span class="selo">${selo}</span>` : ''}
      ${p.modelagem ? `<span class="selo selo--modelo">${esc(p.modelagem)}</span>` : ''}
      <span class="card-ph" data-digital aria-hidden="true"></span>
      ${a ? `<img src="${RAIZ}${esc(versaoCard(a))}" alt="${esc(p.nome)}" ${prio ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="560" height="700" data-fb>` : ''}
    </div>
    <div class="card-corpo">
      <p class="card-tipo">${esc(p.publico)}${p.modelagem ? ` · ${esc(p.modelagem)}` : ''}</p>
      <h3>${esc(p.nome)}</h3>
      <p class="card-linha"><span><span class="preco">${brl(p.preco)}</span>${p.precoDe ? ` <s class="de">${brl(p.precoDe)}</s>` : ''}</span>${pontos}</p>
    </div></a>`;
}

/** Junta um item da sacola com os dados do catálogo. Retorna null se a peça/cor não existe mais. */
export function detalharItem(i, produtos) {
  const p = produtos.find((x) => x.slug === i.slug);
  const cor = p && (p.cores || []).find((c) => c.id === i.cor);
  if (!p || !cor) return null;
  const estoque = cor.grade?.[i.tam] || 0;
  const imgs = imagensDaCor(p, cor);
  return { ...i, p, cor, estoque, preco: p.preco, img: imgs[0] || '', subtotal: p.preco * i.qtd };
}
