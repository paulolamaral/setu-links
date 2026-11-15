import { carregarCatalogo, cardProduto } from './catalogo.js?v=adb5b385e5';
import { esc, injetarSimbolo, RAIZ } from './util.js?v=adb5b385e5';

// página gerada: id vem do HTML (endereço limpo); molde antigo: ?c=
const id = document.getElementById('colecao-topo')?.dataset.colecao || new URLSearchParams(location.search).get('c');
const { colecoes, produtos } = await carregarCatalogo();
const col = colecoes.find((c) => c.id === id);
const topo = document.getElementById('colecao-topo');
const grade = document.getElementById('colecao-grade');
const filtros = document.getElementById('filtros');

function msg(titulo, texto) {
  topo.innerHTML = `<h1>${titulo}</h1><p>${texto}</p><p><a class="btn" href="${RAIZ}#colecoes">Ver coleções</a></p>`;
  filtros.hidden = true;
  grade.innerHTML = '';
}

if (!col) {
  document.title = 'Coleção não encontrada — Sê Tu';
  msg('Essa coleção não existe.', 'Mas tem muita coisa boa por aqui.');
} else if (col.status === 'em-breve') {
  document.title = `${col.nome} — Sê Tu`;
  msg(esc(col.nome), 'Esta coleção chega em breve.');
} else {
  document.title = `${col.nome} — Sê Tu`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', col.descricao || '');
  topo.innerHTML = `<p class="eyebrow">coleção</p><h1>${esc(col.nome)}</h1><p class="lead-col">${esc(col.descricao)}</p>`;
  const total = produtos.filter((p) => p.colecao === col.id).length;
  topo.insertAdjacentHTML('beforeend', `<p class="eyebrow">${total} ${total === 1 ? 'peça' : 'peças'}</p>`);
  const lista = produtos.filter((p) => p.colecao === col.id);
  const publicos = [...new Set(lista.map((p) => p.publico))];
  let atual = 'todos';

  const desenhar = () => {
    const vis = lista.filter((p) => atual === 'todos' || p.publico === atual);
    grade.innerHTML = vis.length ? vis.map((p, i) => cardProduto(p, i < 3)).join('') : '<p class="vazio">Nenhuma peça por aqui ainda.</p>';
    filtros.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === atual)));
    injetarSimbolo();
  };

  if (publicos.length > 1) {
    filtros.innerHTML = ['todos', ...publicos].map((f) => `<button type="button" data-f="${esc(f)}">${f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('');
    filtros.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) { atual = b.dataset.f; desenhar(); }
    });
  } else filtros.hidden = true;
  desenhar();
}

// avisa que o conteúdo da página já está montado (o rodapé só aparece depois disso)
document.body.classList.add('pronto');
