import { carregarCatalogo, detalharItem, fotosCard, versaoCard, esgotado } from './catalogo.js?v=adb5b385e5';
import { alterar, itens } from './sacola.js?v=adb5b385e5';
import { brl, esc, injetarSimbolo, RAIZ } from './util.js?v=adb5b385e5';
import { linhaHtml, quantosItens, rotuloItens, vazioHtml, GARANTIAS } from './sacola-ui.js?v=adb5b385e5';

const naPaginaSacola = /\/sacola\/?(index\.html)?$/.test(location.pathname);
let el, aberta = false, ultimoFoco;

function criar() {
  el = document.createElement('div');
  el.className = 'gaveta';
  el.hidden = true;
  el.innerHTML = `<div class="gaveta-fundo" data-fechar></div>
    <aside class="gaveta-painel" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo">
      <header><h2 id="gaveta-titulo">Sua sacola <span class="gaveta-n" id="gaveta-n"></span></h2><button type="button" class="gaveta-x" data-fechar aria-label="Fechar sacola">×</button></header>
      <div class="gaveta-corpo" id="gaveta-corpo"></div>
      <footer id="gaveta-rodape"></footer>
    </aside>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) return fechar();
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const [slug, cor, tam] = b.dataset.k.split('|');
    const atual = itens().find((i) => i.slug === slug && i.cor === cor && i.tam === tam);
    if (!atual) return;
    if (b.dataset.act === 'rem') alterar(slug, cor, tam, 0);
    if (b.dataset.act === 'menos') alterar(slug, cor, tam, atual.qtd - 1);
    if (b.dataset.act === 'mais') alterar(slug, cor, tam, Math.min(atual.qtd + 1, Number(b.dataset.max)));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aberta) fechar(); });
}

async function desenhar() {
  const { produtos } = await carregarCatalogo();
  const det = itens().map((i) => detalharItem(i, produtos)).filter(Boolean);
  const corpo = el.querySelector('#gaveta-corpo');
  const rod = el.querySelector('#gaveta-rodape');
  const cab = el.querySelector('#gaveta-n');
  if (!det.length) {
    cab.textContent = '';
    corpo.innerHTML = vazioHtml(`${RAIZ}#pecas`);
    rod.innerHTML = '<button type="button" class="btn btn--ghost" data-fechar>Continuar comprando</button>';
    injetarSimbolo();
    return;
  }
  cab.textContent = rotuloItens(quantosItens(det));
  const naSacola = new Set(det.map((i) => i.slug));
  const sug = produtos.filter((p) => !naSacola.has(p.slug) && !esgotado(p)).slice(0, 2);
  const sugHtml = sug.length ? `<section class="sug" aria-label="Combine com"><p class="sug-t">Combine com</p><div class="sug-g">${sug.map((p) => {
    const f = fotosCard(p)[0];
    return `<a class="sug-i" href="${RAIZ}produto/${encodeURIComponent(p.slug)}/">${f ? `<img src="${RAIZ}${esc(versaoCard(f))}" alt="" width="120" height="150" loading="lazy">` : ''}<span>${esc(p.nome)}</span><b>${brl(p.preco)}</b></a>`;
  }).join('')}</div></section>` : '';
  corpo.innerHTML = `<ul class="linhas">${det.map(linhaHtml).join('')}</ul>${sugHtml}`;
  const sub = det.reduce((a, i) => a + i.subtotal, 0);
  rod.innerHTML = `<p class="subtotal"><span>Subtotal</span><b>${brl(sub)}</b></p>
    <ul class="gaveta-nota">${GARANTIAS.map((g) => `<li>${g}</li>`).join('')}</ul>
    <a class="btn" href="${RAIZ}sacola/">Finalizar pedido <span aria-hidden="true">→</span></a>
    <button type="button" class="btn btn--ghost" data-fechar>Continuar comprando</button>`;
}

export function abrir() {
  if (!el) criar();
  ultimoFoco = document.activeElement;
  el.hidden = false; aberta = true;
  document.body.classList.add('sem-scroll');
  desenhar().then(() => el.querySelector('.gaveta-x').focus());
}
export function fechar() {
  if (!el) return;
  el.hidden = true; aberta = false;
  document.body.classList.remove('sem-scroll');
  ultimoFoco?.focus?.();
}

export function iniciarGaveta() {
  if (naPaginaSacola) return;
  window.addEventListener('sacola:adicionou', abrir);
  window.addEventListener('sacola:mudou', () => { if (aberta) desenhar(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.sacola-link');
    if (a) { e.preventDefault(); abrir(); }
  });
}
