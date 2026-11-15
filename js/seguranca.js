// Tudo que vem de fora (JSON, localStorage, formulário) passa por aqui antes de virar HTML, link ou imagem.
// Regra de ouro: imagens só da pasta assets/ do próprio site; links só https de hosts permitidos.
import { carregarJSON, url } from './util.js?v=5ab12daffd';

export const TAMANHOS_OK = ['P', 'M', 'G', 'GG', 'G1', 'EXG'];

/** Caminho de imagem local: assets/.../arquivo.(webp|jpg|png|svg). Nada de http(s)://, //, .. ou data:. */
const ASSET_RE = /^assets\/[a-z0-9][a-z0-9_\-./]*\.(webp|jpe?g|png|svg)$/i;
export const assetSeguro = (p) => (typeof p === 'string' && ASSET_RE.test(p) && !p.includes('..') && !p.includes('//') ? p : '');

/** URL https (e, se informado, de um host da lista). Qualquer outra coisa (javascript:, data:, http:) vira ''. */
export function urlHttps(u, hosts) {
  try {
    const x = new URL(String(u));
    if (x.protocol !== 'https:' || x.username || x.password) return '';
    if (hosts && !hosts.some((h) => x.hostname === h || x.hostname.endsWith(`.${h}`))) return '';
    return x.href;
  } catch (e) { return ''; }
}

export const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');
export const slugSeguro = (v) => (typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(v) ? v : '');
export const corHex = (v) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : '#999999');

/** Texto livre: remove caracteres de controle e de inversão de texto (bidi), limita o tamanho. */
export const texto = (v, max = 200) => String(v ?? '')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, ' ')
  .replace(/\s+/g, ' ').trim().slice(0, max);

const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };
const inteiro = (v, min, max) => { const n = Number(v); return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : null; };

export function sanitizarCatalogo(d) {
  const colecoes = (Array.isArray(d?.colecoes) ? d.colecoes : []).map((c) => ({
    id: slugSeguro(c?.id),
    nome: texto(c?.nome, 80),
    descricao: texto(c?.descricao, 400),
    status: c?.status === 'em-breve' ? 'em-breve' : 'ativa',
    capa: assetSeguro(c?.capa),
    ordem: num(c?.ordem, 0, 999) ?? 0,
  })).filter((c) => c.id && c.nome);

  const produtos = (Array.isArray(d?.produtos) ? d.produtos : []).map((p) => ({
    slug: slugSeguro(p?.slug),
    nome: texto(p?.nome, 100),
    colecao: slugSeguro(p?.colecao),
    publico: ['masculino', 'feminino', 'unissex'].includes(p?.publico) ? p.publico : 'unissex',
    preco: num(p?.preco, 0, 100000) ?? 0,
    precoDe: p?.precoDe == null ? null : num(p.precoDe, 0, 100000),
    descricao: texto(p?.descricao, 700),
    detalhes: (Array.isArray(p?.detalhes) ? p.detalhes : []).slice(0, 12).map((x) => texto(x, 120)).filter(Boolean),
    cores: (Array.isArray(p?.cores) ? p.cores : []).slice(0, 12).map((c) => ({
      id: slugSeguro(c?.id),
      nome: texto(c?.nome, 30),
      hex: corHex(c?.hex),
      capa: assetSeguro(c?.capa),
      imagens: (Array.isArray(c?.imagens) ? c.imagens : []).slice(0, 20).map(assetSeguro).filter(Boolean),
      grade: Object.fromEntries(Object.entries(c?.grade && typeof c.grade === 'object' ? c.grade : {})
        .filter(([t]) => TAMANHOS_OK.includes(t)).map(([t, n]) => [t, inteiro(n, 0, 999) ?? 0])),
    })).filter((c) => c.id && c.nome),
    modelagem: p?.modelagem === 'oversize' ? 'oversize' : '',
    edicaoLimitada: p?.edicaoLimitada === true,
    destaque: p?.destaque === true,
    ativo: p?.ativo !== false,
  })).filter((p) => p.slug && p.nome);

  return { colecoes: colecoes.sort((a, b) => a.ordem - b.ordem), produtos };
}

export function sanitizarLoja(l) {
  const zap = soDigitos(l?.whatsapp);
  const idPixel = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : '');
  return {
    marca: texto(l?.marca, 40) || 'Sê Tu',
    tagline: texto(l?.tagline, 80),
    whatsapp: zap.length >= 10 && zap.length <= 15 ? zap : '',
    instagram: urlHttps(l?.instagram, ['instagram.com']),
    moeda: 'BRL',
    entrega: { opcoes: (Array.isArray(l?.entrega?.opcoes) ? l.entrega.opcoes : []).slice(0, 8)
      .map((o) => ({ id: slugSeguro(o?.id), rotulo: texto(o?.rotulo, 120) })).filter((o) => o.id && o.rotulo) },
    webhookPedidos: urlHttps(l?.webhookPedidos),
    rastreio: { metaPixelId: idPixel(l?.rastreio?.metaPixelId), ga4Id: idPixel(l?.rastreio?.ga4Id) },
    avisoTopo: texto(l?.avisoTopo, 160),
    versiculos: Object.fromEntries(Object.entries(l?.versiculos && typeof l.versiculos === 'object' ? l.versiculos : {})
      .filter(([k]) => /^[a-z0-9-]{1,30}$/.test(k))
      .map(([k, v]) => [k, { texto: texto(v?.texto, 400), ref: texto(v?.ref, 60) }])),
  };
}

let _loja;
export async function carregarLoja() {
  _loja ??= sanitizarLoja(await carregarJSON(url('data/loja.json')));
  return _loja;
}
