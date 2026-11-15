import { carregarCatalogo, cardProduto, imagensDaCor, estoqueCor, esgotado, TAMANHOS } from './catalogo.js?v=adb5b385e5';
import { adicionar, qtdNaSacola } from './sacola.js?v=adb5b385e5';
import { brl, esc, injetarSimbolo, linkZap, RAIZ } from './util.js?v=adb5b385e5';
import { carregarLoja } from './seguranca.js?v=adb5b385e5';
import { verProduto, adicionouNaSacola } from './rastreio.js?v=adb5b385e5';

// página gerada: slug vem do HTML (endereço limpo); molde antigo: ?p=
const slug = document.getElementById('produto')?.dataset.slug || new URLSearchParams(location.search).get('p');
const raiz = document.getElementById('produto');
const { produtos, colecoes } = await carregarCatalogo();
const loja = await carregarLoja();
const p = produtos.find((x) => x.slug === slug);

if (!p) {
  document.title = 'Peça não encontrada — Sê Tu';
  raiz.innerHTML = `<div class="vazio"><h1>Não encontramos essa peça.</h1>
    <p>Ela pode ter esgotado ou mudado de endereço.</p>
    <a class="btn" href="${RAIZ}#pecas">Ver as peças</a></div>`;
} else {
  document.body.classList.add('pdp-pagina');
  verProduto(p);
  document.title = `${p.nome} — Sê Tu`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.descricao || '');

  const cores = p.cores || [];
  let cor = cores.find((c) => estoqueCor(c) > 0) || cores[0];
  let tam = null;
  let qtd = 1;

  const zap = linkZap(loja.whatsapp, `Oi, Sê Tu! Tenho uma dúvida sobre "${p.nome}".`);
  const grade = () => cor.grade || {};
  const tamanhos = TAMANHOS.filter((t) => t in grade()).length ? TAMANHOS : Object.keys(grade());
  const outras = produtos.filter((x) => x.colecao === p.colecao && x.slug !== p.slug).slice(0, 4);

  const col = colecoes.find((c) => c.id === p.colecao);
  const migalhas = `<nav class="migalhas" aria-label="Você está em"><a href="${RAIZ}">Início</a>${col ? `<span aria-hidden="true">›</span><a href="${RAIZ}colecao/${esc(col.id)}/">${esc(col.nome)}</a>` : ''}<span aria-hidden="true">›</span><span aria-current="page">${esc(p.nome)}</span></nav>`;

  raiz.innerHTML = `
    ${migalhas}
    <div class="pdp">
      <div class="galeria" id="galeria"></div>
      <div class="pdp-info">
        <p class="eyebrow">${esc(p.publico)}${p.modelagem ? ' · ' + esc(p.modelagem) : ''}${p.edicaoLimitada ? ' · edição limitada' : ''}</p>
        <h1>${esc(p.nome)}</h1>
        ${p.modelagem ? `<p class="pdp-modelo"><b>${esc(p.modelagem)}</b><span>Caimento mais solto e largo. Dúvida sobre o tamanho? <a href="${zap}" target="_blank" rel="noopener noreferrer">Fale com a gente</a>.</span></p>` : ''}
        <p class="pdp-preco"><span class="preco">${brl(p.preco)}</span>${p.precoDe ? ` <s class="de">${brl(p.precoDe)}</s>` : ''}</p>
        <p class="pdp-desc">${esc(p.descricao)}</p>

        ${cores.length > 1 ? `<fieldset class="opcao"><legend>Cor <b id="cor-nome"></b></legend><div class="cores" id="cores"></div></fieldset>` : ''}
        <fieldset class="opcao" id="opcao-tam"><legend>Tamanho</legend><div class="tamanhos" id="tamanhos"></div>
          <p class="aviso-tam" id="aviso-tam" role="status" aria-live="polite"></p></fieldset>

        <div class="comprar" id="comprar">
          <div class="qtd" role="group" aria-label="Quantidade">
            <button type="button" id="menos" aria-label="Diminuir">−</button>
            <output id="qtd" aria-live="polite">1</output>
            <button type="button" id="mais" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="btn" id="add">Adicionar à sacola</button>
        </div>
        <p class="feedback" id="feedback" role="status" aria-live="polite"></p>

        ${esgotado(p) ? '<p class="aviso-tam">Esta peça está esgotada no momento.</p>' : ''}
        <ul class="garantias">
          <li>Pedido direto pelo WhatsApp, sem cadastro</li>
          <li>Edição limitada: poucas unidades por tamanho</li>
          <li>Frete e pagamento combinados na conversa</li>
        </ul>
        ${(p.detalhes || []).length ? `<ul class="detalhes">${p.detalhes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        <p class="duvida"><a href="${zap}" target="_blank" rel="noopener noreferrer">Dúvida? Fale com a gente no WhatsApp</a></p>
      </div>
    </div>
    ${outras.length ? `<section class="relacionados"><h2>Mais da coleção</h2><div class="grade grade--4">${outras.map(cardProduto).join('')}</div></section>` : ''}`;

  const $ = (id) => document.getElementById(id);

  function desenharGaleria() {
    const imgs = imagensDaCor(p, cor);
    $('galeria').innerHTML = imgs.length ? `
      <div class="galeria-moldura">
        <div class="galeria-fotos" id="fotos" tabindex="0" aria-label="Fotos de ${esc(p.nome)}">
          ${imgs.map((s, i) => `<img src="${RAIZ}${esc(s)}" alt="${esc(p.nome)}${cor ? ' — ' + esc(cor.nome) : ''} (foto ${i + 1} de ${imgs.length})" width="800" height="1000" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}
        </div>
        ${imgs.length > 1 ? `<div class="dots" id="dots" aria-hidden="true">${imgs.map((_, i) => `<i ${i === 0 ? 'class="on"' : ''}></i>`).join('')}</div>
        <span class="contador" id="contador" aria-hidden="true">1/${imgs.length}</span>` : ''}
      </div>
      ${imgs.length > 1 ? `<div class="miniaturas" id="mini">${imgs.map((s, i) => `<button type="button" data-i="${i}" aria-label="Ver foto ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${RAIZ}${esc(s)}" alt="" width="80" height="100" loading="lazy"></button>`).join('')}</div>` : ''}`
      : '<div class="galeria-vazia" data-digital aria-hidden="true"></div>';
    const fotos = $('fotos');
    if (fotos && imgs.length > 1) {
      fotos.addEventListener('scroll', () => {
        const i = Math.round(fotos.scrollLeft / fotos.clientWidth);
        $('dots').querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));
        $('contador').textContent = `${i + 1}/${imgs.length}`;
        $('mini').querySelectorAll('button').forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      }, { passive: true });
      $('mini').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        fotos.scrollTo({ left: fotos.clientWidth * Number(b.dataset.i), behavior: 'smooth' });
      });
    }
    injetarSimbolo();
  }

  function desenharCores() {
    const el = $('cores'); if (!el) return;
    $('cor-nome').textContent = cor.nome;
    el.innerHTML = cores.map((c) => `<button type="button" class="cor" data-id="${esc(c.id)}" style="--c:${esc(c.hex || '#999')}" aria-label="${esc(c.nome)}${estoqueCor(c) ? '' : ' (esgotada)'}" aria-pressed="${c === cor}" ${estoqueCor(c) ? '' : 'data-off'}></button>`).join('');
  }

  function desenharTamanhos() {
    $('tamanhos').innerHTML = tamanhos.map((t) => {
      const n = grade()[t] || 0;
      return `<button type="button" class="tam" data-t="${esc(t)}" aria-pressed="${tam === t}" ${n ? '' : 'disabled'} ${n ? '' : 'title="esgotado"'}>${esc(t)}</button>`;
    }).join('');
  }

  function atualizar() {
    const n = tam ? grade()[tam] || 0 : 0;
    const noCarrinho = tam ? qtdNaSacola(p.slug, cor.id, tam) : 0;
    qtd = Math.max(1, Math.min(qtd, Math.max(1, n - noCarrinho)));
    $('qtd').textContent = qtd;
    $('aviso-tam').textContent = tam && n > 0 && n <= 2 ? 'Últimas unidades neste tamanho.' : '';
  }

  function pedirTamanho(msg) {
    $('opcao-tam').classList.add('erro');
    $('feedback').textContent = msg;
    $('opcao-tam').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  raiz.addEventListener('click', (e) => {
    const c = e.target.closest('.cor');
    if (c) {
      cor = cores.find((x) => x.id === c.dataset.id);
      if (tam && !(grade()[tam] > 0)) tam = null;
      desenharCores(); desenharGaleria(); desenharTamanhos(); atualizar();
      $('feedback').textContent = '';
      return;
    }
    const t = e.target.closest('.tam');
    if (t && !t.disabled) {
      tam = t.dataset.t; qtd = 1;
      $('opcao-tam').classList.remove('erro'); $('feedback').textContent = '';
      desenharTamanhos(); atualizar();
    }
  });

  $('menos').addEventListener('click', () => { qtd = Math.max(1, qtd - 1); atualizar(); });
  $('mais').addEventListener('click', () => {
    if (!tam) return pedirTamanho('Escolha um tamanho primeiro.');
    qtd += 1; atualizar();
  });

  $('add').addEventListener('click', () => {
    if (!tam) return pedirTamanho('Escolha um tamanho para continuar.');
    const n = grade()[tam] || 0;
    const ja = qtdNaSacola(p.slug, cor.id, tam);
    if (ja >= n) { $('feedback').textContent = 'Você já tem todas as unidades disponíveis deste tamanho na sacola.'; return; }
    adicionar({ slug: p.slug, cor: cor.id, tam, qtd }, n);
    adicionouNaSacola(p, cor, tam, qtd);
    $('feedback').innerHTML = `Adicionado à sacola. <a href="${RAIZ}sacola/">Ver sacola</a>`;
    atualizar();
  });

  desenharCores(); desenharGaleria(); desenharTamanhos(); atualizar();
  injetarSimbolo();
}

// avisa que o conteúdo da página já está montado (o rodapé só aparece depois disso)
document.body.classList.add('pronto');
