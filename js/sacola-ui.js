// Pedaços de interface da sacola, usados na gaveta e na página da sacola (um só desenho para os dois).
import { brl, esc, RAIZ } from './util.js?v=adb5b385e5';

const ICONE_LIXO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg>';

/** Uma linha da sacola. */
export function linhaHtml(i) {
  const k = `${i.slug}|${i.cor.id}|${i.tam}`;
  const link = `${RAIZ}produto/${encodeURIComponent(i.slug)}/`;
  const ultimas = i.estoque > 0 && i.estoque <= 2;
  return `<li class="linha">
    <a class="linha-foto" href="${link}" tabindex="-1" aria-hidden="true">${i.img ? `<img src="${RAIZ}${esc(i.img)}" alt="" width="88" height="110">` : '<span class="linha-ph"></span>'}</a>
    <div class="linha-info">
      <a class="linha-nome" href="${link}">${esc(i.p.nome)}</a>
      <p class="linha-var"><i class="linha-cor" style="--c:${esc(i.cor.hex || '#999')}"></i>${esc(i.cor.nome)}<span aria-hidden="true">·</span>Tam. ${esc(i.tam)}${i.p.modelagem ? `<span class="linha-tag">${esc(i.p.modelagem)}</span>` : ''}</p>
      ${ultimas ? '<p class="linha-ult">Últimas unidades</p>' : ''}
      <div class="qtd qtd--p" role="group" aria-label="Quantidade de ${esc(i.p.nome)}">
        <button type="button" data-act="menos" data-k="${esc(k)}" aria-label="Diminuir">−</button>
        <output>${i.qtd}</output>
        <button type="button" data-act="mais" data-k="${esc(k)}" data-max="${i.estoque}" aria-label="Aumentar" ${i.qtd >= i.estoque ? 'disabled' : ''}>+</button>
      </div>
    </div>
    <div class="linha-preco">
      <b>${brl(i.subtotal)}</b>
      ${i.qtd > 1 ? `<small>${i.qtd} × ${brl(i.preco)}</small>` : ''}
      <button type="button" class="linha-rem" data-act="rem" data-k="${esc(k)}" aria-label="Remover ${esc(i.p.nome)} da sacola">${ICONE_LIXO}</button>
    </div>
  </li>`;
}

export const quantosItens = (det) => det.reduce((a, i) => a + i.qtd, 0);
export const rotuloItens = (n) => `${n} ${n === 1 ? 'item' : 'itens'}`;

/** Sacola vazia, com a digital e um caminho de volta. */
export function vazioHtml(href) {
  return `<div class="sacola-vazia">
    <span class="sacola-vazia-digital" data-digital aria-hidden="true"></span>
    <h3>Sua sacola está vazia.</h3>
    <p>Escolha uma peça e ela aparece aqui.</p>
    <a class="btn" href="${href}">Ver as peças</a>
  </div>`;
}

export const NOTA_PAGAMENTO = 'PIX, cartão de crédito ou débito, por link de pagamento enviado no WhatsApp. Frete combinado na conversa.';
export const GARANTIAS = ['PIX, crédito ou débito por link', 'Frete combinado no WhatsApp'];
