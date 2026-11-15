// Página 404: em vez de um beco sem saída, mostra algumas peças para o visitante continuar na loja.
import { injetarSimbolo } from './util.js?v=adb5b385e5';
import { carregarCatalogo, cardProduto } from './catalogo.js?v=adb5b385e5';

const { produtos } = await carregarCatalogo();
const lista = produtos.filter((p) => p.destaque).slice(0, 4);
const grade = document.getElementById('erro-pecas');
if (grade && lista.length) {
  grade.innerHTML = lista.map((p) => cardProduto(p)).join('');
  document.getElementById('erro-vitrine').hidden = false;
  injetarSimbolo();
}
document.body.classList.add('pronto');
