// Rastreamento (Meta Pixel e GA4). Só carrega se o ID estiver preenchido em data/loja.json.
// Regras: nenhum dado pessoal (nome, cidade, observação) vai para os pixels; respeita "Não rastrear" do navegador;
// se o Pixel/GA4 falhar ou estiver bloqueado (adblock), o site segue funcionando normalmente.
import { carregarLoja } from './seguranca.js?v=424230757c';

let cfg = null;        // { meta, ga4 } depois de iniciar
let promessa = null;

function carregarScript(src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  s.onerror = () => {};              // bloqueado por extensão: ignora
  document.head.appendChild(s);
}

function iniciarMeta(id) {
  if (window.fbq) return;
  const n = (window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
  if (!window._fbq) window._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  carregarScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}

function iniciarGa4(id) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
  carregarScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

export function iniciarRastreio() {
  promessa ??= iniciar();
  return promessa;
}

async function iniciar() {
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    const loja = await carregarLoja();
    cfg = { meta: loja.rastreio?.metaPixelId || '', ga4: loja.rastreio?.ga4Id || '' };
    if (cfg.meta) iniciarMeta(cfg.meta);
    if (cfg.ga4) iniciarGa4(cfg.ga4);
  } catch (e) { /* rastreio nunca pode quebrar a loja */ }
}

/** Dispara no Meta e/ou no GA4, conforme o que estiver configurado. Seguro de chamar sempre. */
async function disparar(meta, ga4) {
  try {
    await iniciarRastreio();          // garante que o Pixel já iniciou (evita perder o primeiro evento)
    if (cfg?.meta && window.fbq) (Array.isArray(meta[0]) ? meta : [meta]).forEach((m) => window.fbq('track', ...m));
    if (cfg?.ga4 && window.gtag && ga4) window.gtag('event', ga4[0], ga4[1]);
  } catch (e) { /* ignora */ }
}

const itemGa = (p, preco, qtd = 1, extra = {}) => ({ item_id: p.slug, item_name: p.nome, price: preco, quantity: qtd, ...extra });

// Abriu a página de um produto
export function verProduto(p) {
  disparar(['ViewContent', { content_ids: [p.slug], content_name: p.nome, content_type: 'product', value: p.preco, currency: 'BRL' }],
    ['view_item', { currency: 'BRL', value: p.preco, items: [itemGa(p, p.preco)] }]);
}

// Adicionou à sacola
export function adicionouNaSacola(p, cor, tam, qtd) {
  const valor = p.preco * qtd;
  disparar(['AddToCart', { content_ids: [p.slug], content_name: p.nome, content_type: 'product', value: valor, currency: 'BRL', contents: [{ id: p.slug, quantity: qtd }] }],
    ['add_to_cart', { currency: 'BRL', value: valor, items: [itemGa(p, p.preco, qtd, { item_variant: `${cor.nome} / ${tam}` })] }]);
}

// Abriu a sacola para finalizar
export function iniciouPedido(det, total) {
  const ids = det.map((i) => i.slug);
  const n = det.reduce((a, i) => a + i.qtd, 0);
  disparar(['InitiateCheckout', { content_ids: ids, content_type: 'product', num_items: n, value: total, currency: 'BRL' }],
    ['begin_checkout', { currency: 'BRL', value: total, items: det.map((i) => itemGa(i.p, i.preco, i.qtd)) }]);
}

// Enviou o pedido ao WhatsApp (sem nome, cidade ou observação)
export function enviouPedido(det, total) {
  const ids = det.map((i) => i.slug);
  disparar([['Contact', { value: total, currency: 'BRL' }], ['Lead', { content_ids: ids, value: total, currency: 'BRL' }]],
    ['generate_lead', { currency: 'BRL', value: total }]);
}
