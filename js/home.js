import { esc, injetarSimbolo, RAIZ } from './util.js?v=adb5b385e5';
import { carregarCatalogo, cardProduto } from './catalogo.js?v=adb5b385e5';

const dados = await carregarCatalogo();
const colecoes = dados.colecoes;
const grade = document.getElementById('colecoes-grade');

// Se a foto ainda não existe, a imagem some e fica o fundo areia
const img = (src, alt) => src
  ? `<img src="${RAIZ}${esc(src)}" alt="${esc(alt)}" loading="lazy" width="600" height="750" data-fb>`
  : '';

grade.innerHTML = colecoes.length ? colecoes.map((c, i) => {
  const breve = c.status === 'em-breve';
  const tag = breve ? 'div' : 'a';
  const href = breve ? '' : ` href="${RAIZ}colecao/${encodeURIComponent(c.id)}/"`;
  const n = (dados.produtos || []).filter((p) => p.ativo !== false && p.colecao === c.id).length;
  return `<${tag} class="col-card"${href}>
    <div class="col-foto"><span class="card-ph" data-digital aria-hidden="true"></span>${img(c.capa, c.nome)}</div>
    ${breve ? '<span class="selo">em breve</span>' : `<span class="col-num">${String(i + 1).padStart(2, '0')}</span>`}
    <div class="col-info">
      <p class="col-qtd">${breve ? 'Em breve' : `${n} ${n === 1 ? 'peça' : 'peças'}`}</p>
      <h3>${esc(c.nome)}</h3>
      <p class="col-desc">${esc(c.descricao)}</p>
      ${breve ? '' : '<span class="col-cta">Ver coleção <i aria-hidden="true">→</i></span>'}
    </div></${tag}>`;
}).join('') : '<p class="vazio">Novidades em breve.</p>';

const destaques = (dados.produtos || []).filter((p) => p.ativo !== false && p.destaque);
const tileFim = `<a class="card card--cta" href="${RAIZ}colecao/${encodeURIComponent(colecoes[0]?.id || '')}/">
  <div class="card-img"><span class="card-ph" data-digital aria-hidden="true"></span></div>
  <div class="cta-txt"><b>Sê tu.</b><span>Ver toda a coleção →</span></div></a>`;
const gradePecas = document.getElementById('destaques-grade');
const abas = document.getElementById('abas-pecas');
let filtro = 'todos';

function desenharPecas() {
  const lista = destaques.filter((p) => filtro === 'todos' || p.publico === filtro);
  gradePecas.innerHTML = lista.length
    ? lista.map((p) => cardProduto(p)).join('') + (filtro === 'todos' && colecoes.length ? tileFim : '')
    : '<p class="vazio">Nenhuma peça por aqui ainda.</p>';
  abas?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filtro)));
  injetarSimbolo();
}

const publicos = [...new Set(destaques.map((p) => p.publico))];
if (abas && publicos.length > 1) {
  abas.innerHTML = ['todos', ...publicos].map((f) => `<button type="button" data-f="${esc(f)}">${f === 'todos' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('');
  abas.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { filtro = b.dataset.f; desenharPecas(); }
  });
} else if (abas) abas.hidden = true;
const cont = document.getElementById('pecas-total');
if (cont) cont.textContent = `${destaques.length} ${destaques.length === 1 ? 'peça' : 'peças'} em edição limitada`;
desenharPecas();
injetarSimbolo();

// avisa que o conteúdo da página já está montado (o rodapé só aparece depois disso)
document.body.classList.add('pronto');
