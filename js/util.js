export const RAIZ = new URL('../', import.meta.url).href; // raiz do site, independente da pasta da página
// A versão (?v=...) do próprio util.js também vai nos arquivos de dados, para atualizações chegarem na hora.
const VERSAO = new URL(import.meta.url).search;
export const url = (p) => RAIZ + p + (/\.(json|svg)$/.test(p) ? VERSAO : '');

export const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function codigoPedido(d = new Date()) {
  const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I
  const p = (n) => String(n).padStart(2, '0');
  const data = `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  let r = '';
  for (let i = 0; i < 4; i++) r += alfa[Math.floor(Math.random() * alfa.length)];
  return `ST-${data}-${r}`;
}

export async function carregarJSON(caminho) {
  try {
    const r = await fetch(caminho);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn('Falha ao carregar', caminho, e);
    return null;
  }
}

let _simbolo;
export async function injetarSimbolo() {
  try {
    _simbolo ??= await (await fetch(url('assets/brand/digital.svg'))).text();
    document.querySelectorAll('[data-digital]:empty').forEach((el) => { el.innerHTML = _simbolo; });
  } catch (e) { /* símbolo é decorativo */ }
}

/**
 * Link de conversa no WhatsApp. Usa api.whatsapp.com/send direto (e NÃO wa.me):
 * o redirecionamento do wa.me troca qualquer emoji por "�" no servidor do WhatsApp.
 */
export const linkZap = (numero, texto = '') =>
  `https://api.whatsapp.com/send?phone=${encodeURIComponent(numero || '')}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`;

/** Imagem marcada com data-fb que falha ao carregar some (sem onerror inline: o CSP bloqueia handlers inline). */
export function instalarFallbackImagens() {
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el instanceof HTMLImageElement && el.hasAttribute('data-fb')) el.remove();
  }, true);
}

/** Foto alternativa do card (hover) só é baixada quando há mouse e a pessoa passa por cima. No celular nunca baixa. */
export function instalarHoverAlt() {
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const c = e.target instanceof Element ? e.target.closest('.card-img[data-alt]') : null;
    if (!c) return;
    const src = c.dataset.alt; c.removeAttribute('data-alt');
    const im = new Image();
    im.className = 'alt'; im.alt = ''; im.decoding = 'async';
    im.addEventListener('load', () => c.appendChild(im));
    im.src = src;
  }, { passive: true });
}
