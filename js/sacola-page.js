import { carregarCatalogo, detalharItem } from './catalogo.js?v=5ab12daffd';
import { alterar, esvaziar, itens } from './sacola.js?v=5ab12daffd';
import { codigoPedido, brl, esc, injetarSimbolo, RAIZ } from './util.js?v=5ab12daffd';
import { linhaHtml, quantosItens, rotuloItens, vazioHtml, NOTA_PAGAMENTO } from './sacola-ui.js?v=5ab12daffd';
import { carregarLoja, texto as limparTexto } from './seguranca.js?v=5ab12daffd';
import { iniciouPedido, enviouPedido } from './rastreio.js?v=5ab12daffd';
import { enviarWebhook, linkWhatsApp, montarMensagem } from './whatsapp.js?v=5ab12daffd';

const raiz = document.getElementById('sacola');
const { produtos } = await carregarCatalogo();
const loja = await carregarLoja();
const opcoes = loja.entrega?.opcoes?.length ? loja.entrega.opcoes : [{ id: 'combinar', rotulo: 'Combinar no WhatsApp' }];

const detalhes = () => itens().map((i) => detalharItem(i, produtos)).filter(Boolean);

function limparInvalidos() {
  // remove itens de peças/cores que saíram do catálogo e ajusta quantidades acima do estoque
  itens().forEach((i) => {
    const d = detalharItem(i, produtos);
    if (!d || d.estoque < 1) alterar(i.slug, i.cor, i.tam, 0);
    else if (i.qtd > d.estoque) alterar(i.slug, i.cor, i.tam, d.estoque);
  });
}

function desenhar() {
  limparInvalidos();
  const det = detalhes();
  if (!det.length) {
    raiz.innerHTML = `<h1 class="sacola-titulo">Sua sacola</h1>${vazioHtml(`${RAIZ}#pecas`)}`;
    injetarSimbolo();
    return;
  }
  const sub = det.reduce((a, i) => a + i.subtotal, 0);
  raiz.innerHTML = `
    <div class="sacola-cab"><h1 class="sacola-titulo">Sua sacola</h1><p class="sacola-qtd">${rotuloItens(quantosItens(det))}</p></div>
    <ol class="sacola-passos" aria-label="Etapas do pedido"><li data-on>1. Revise</li><li>2. Seus dados</li><li>3. Envie pelo WhatsApp</li></ol>
    <div class="sacola-grid">
      <section class="sacola-itens" aria-label="Itens da sacola">
        <ul class="linhas">${det.map(linhaHtml).join('')}</ul>
        <a class="sacola-mais" href="${RAIZ}#pecas">← Continuar vendo as peças</a>
      </section>

      <aside class="sacola-lado">
        <div class="resumo">
          <h2>Resumo</h2>
          <p class="subtotal"><span>Subtotal</span><b>${brl(sub)}</b></p>
          <p class="resumo-nota"><b>Pagamento:</b> ${NOTA_PAGAMENTO} A disponibilidade é confirmada na conversa.</p>
        </div>

        <form id="form" class="form" novalidate>
          <h2>Seus dados</h2>
          <label>Nome<input name="nome" autocomplete="name" required maxlength="80"></label>
          <label>Cidade/UF<input name="cidade" autocomplete="address-level2" placeholder="Itajaí/SC" required maxlength="60"></label>
          <fieldset><legend>Forma de entrega</legend>
            ${opcoes.map((o, n) => `<label class="radio"><input type="radio" name="entrega" value="${esc(o.id)}" ${n === 0 ? 'checked' : ''}> ${esc(o.rotulo)}</label>`).join('')}
          </fieldset>
          <label>Observação (opcional)<textarea name="obs" rows="3" maxlength="300"></textarea></label>
          <p class="erro-form" id="erro" role="alert"></p>
          <button type="submit" class="btn">Enviar pedido pelo WhatsApp</button>
          <p class="form-nota">Você não paga agora. A conversa abre no WhatsApp com o pedido pronto.</p>
        </form>
      </aside>
    </div>`;
}

raiz.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const [slug, cor, tam] = b.dataset.k.split('|');
  const atual = itens().find((i) => i.slug === slug && i.cor === cor && i.tam === tam);
  if (!atual) return;
  if (b.dataset.act === 'rem') alterar(slug, cor, tam, 0);
  if (b.dataset.act === 'menos') alterar(slug, cor, tam, atual.qtd - 1);
  if (b.dataset.act === 'mais') alterar(slug, cor, tam, Math.min(atual.qtd + 1, Number(b.dataset.max)));
  const guardado = guardarCampos();
  desenhar();
  restaurarCampos(guardado);
});

function guardarCampos() {
  const f = document.getElementById('form');
  return f ? Object.fromEntries(new FormData(f)) : {};
}
function restaurarCampos(v) {
  const f = document.getElementById('form');
  if (!f) return;
  Object.entries(v).forEach(([k, val]) => {
    const el = f.elements[k];
    if (!el) return;
    if (el.length && el[0]?.type === 'radio') [...el].forEach((r) => { r.checked = r.value === val; });
    else el.value = val;
  });
}

raiz.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const nome = limparTexto(f.nome.value, 80);
  const cidade = limparTexto(f.cidade.value, 60);
  const obs = limparTexto(f.obs.value, 300);
  const erro = document.getElementById('erro');
  if (!nome || !cidade) {
    erro.textContent = !nome ? 'Conte seu nome para a gente.' : 'Informe sua cidade e UF.';
    (!nome ? f.nome : f.cidade).focus();
    return;
  }
  erro.textContent = '';
  const det = detalhes();
  if (!det.length) return;
  const subtotal = det.reduce((a, i) => a + i.subtotal, 0);
  const op = opcoes.find((o) => o.id === f.elements.entrega.value) || opcoes[0];
  const codigo = codigoPedido();
  const mensagem = montarMensagem({ codigo, itens: det, subtotal, entrega: op.rotulo, nome, cidade, obs });
  const link = linkWhatsApp(loja.whatsapp, mensagem);
  enviouPedido(det, subtotal);

  enviarWebhook(loja.webhookPedidos, {
    codigo, nome, cidade, entrega: op.rotulo, obs, subtotal: subtotal.toFixed(2),
    itens: det.map((i) => `${i.p.nome} | ${i.cor.nome} | ${i.tam} | ${i.qtd}x`).join('\n'), mensagem,
  });

  raiz.innerHTML = `<div class="vazio confirma"><p class="eyebrow">pedido ${esc(codigo)}</p>
    <h1>Pedido enviado.</h1>
    <p>Abrimos o WhatsApp com tudo preenchido. É só enviar a mensagem para a gente continuar a conversa.</p>
    <p><a class="btn" href="${esc(link)}" rel="noopener noreferrer">Se o WhatsApp não abriu, toque aqui</a></p>
    <p><button type="button" class="link" id="esvaziar">Esvaziar sacola</button> · <a href="${RAIZ}#colecoes">Continuar vendo as peças</a></p></div>`;
  document.getElementById('esvaziar').addEventListener('click', () => { esvaziar(); desenhar(); });
  window.scrollTo(0, 0);
  // location.href (e não window.open): popups costumam ser bloqueados no navegador do Instagram
  setTimeout(() => { window.location.href = link; }, 60);
});

desenhar();
{ const d0 = detalhes(); if (d0.length) iniciouPedido(d0, d0.reduce((a, i) => a + i.subtotal, 0)); }

// avisa que o conteúdo da página já está montado (o rodapé só aparece depois disso)
document.body.classList.add('pronto');
