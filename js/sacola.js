import { slugSeguro } from './seguranca.js?v=5ab12daffd';
// Estado da sacola. localStorage com fallback em memória.
const CHAVE = 'setu.sacola';
let memoria = [];

// Tudo que está no localStorage pode ter sido alterado pelo usuário: só entram itens bem formados.
function limpar(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 50).map((i) => ({
    slug: slugSeguro(i?.slug), cor: slugSeguro(i?.cor),
    tam: typeof i?.tam === 'string' && /^[A-Z0-9]{1,4}$/.test(i.tam) ? i.tam : '',
    qtd: Number.isInteger(i?.qtd) && i.qtd >= 1 ? Math.min(99, i.qtd) : 0,
  })).filter((i) => i.slug && i.cor && i.tam && i.qtd > 0);
}

function ler() {
  try {
    const t = localStorage.getItem(CHAVE);
    return t ? limpar(JSON.parse(t)) : [];
  } catch (e) { return memoria; }
}
function gravar(itens) {
  memoria = itens;
  try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (e) { /* segue em memória */ }
  window.dispatchEvent(new CustomEvent('sacola:mudou'));
}

export const itens = () => ler();
export const quantidade = () => ler().reduce((a, i) => a + i.qtd, 0);

/** Soma ao que já existe, respeitando o estoque informado. Retorna a quantidade efetivamente na sacola. */
export function adicionar({ slug, cor, tam, qtd }, estoque = Infinity) {
  const lista = ler();
  const it = lista.find((i) => i.slug === slug && i.cor === cor && i.tam === tam);
  if (it) it.qtd = Math.min(it.qtd + qtd, estoque);
  else lista.push({ slug, cor, tam, qtd: Math.min(qtd, estoque) });
  gravar(lista);
  window.dispatchEvent(new CustomEvent('sacola:adicionou'));
  return (it ? it.qtd : Math.min(qtd, estoque));
}

export function qtdNaSacola(slug, cor, tam) {
  return ler().find((i) => i.slug === slug && i.cor === cor && i.tam === tam)?.qtd || 0;
}

export function alterar(slug, cor, tam, qtd) {
  const lista = ler().map((i) => (i.slug === slug && i.cor === cor && i.tam === tam ? { ...i, qtd } : i)).filter((i) => i.qtd > 0);
  gravar(lista);
}

export const esvaziar = () => gravar([]);
