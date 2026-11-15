import { esc, injetarSimbolo, instalarFallbackImagens, instalarHoverAlt, linkZap, RAIZ } from './util.js?v=5ab12daffd';
import { carregarLoja } from './seguranca.js?v=5ab12daffd';
import { iniciarRastreio } from './rastreio.js?v=5ab12daffd';
import { quantidade } from './sacola.js?v=5ab12daffd';
import { iniciarGaveta } from './gaveta.js?v=5ab12daffd';

const ICONE_SACOLA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const ICONE_ZAP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.4-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z"/></svg>';

function montar(loja) {
  const marca = esc(loja.marca);
  const raiz = document.getElementById('topo');
  const aviso = loja.avisoTopo ? `<div class="aviso">${esc(loja.avisoTopo)}</div>` : '';
  raiz.innerHTML = `${aviso}
    <header class="header"><div class="wrap">
      <a class="marca" href="${RAIZ}" aria-label="${marca} — início"><span data-digital aria-hidden="true"></span>${marca}</a>
      <nav class="nav" aria-label="Principal">
        <a href="${RAIZ}#colecoes">Coleções</a>
        <a href="${RAIZ}sobre/">Sobre</a>
        <a class="sacola-link" href="${RAIZ}sacola/" aria-label="Sacola">${ICONE_SACOLA}<span class="sacola-n" data-n="0" aria-live="polite">0</span></a>
      </nav>
    </div></header>`;

  const rodape = document.getElementById('rodape');
  if (rodape) {
    const wa = linkZap(loja.whatsapp);
    const entrega = (loja.entrega?.opcoes || []).map((o) => `<li>${esc(o.rotulo.replace(/\s*\(.*\)/, ''))}</li>`).join('');
    rodape.innerHTML = `<div class="wrap">
      <div class="rodape-topo">
        <div class="rodape-marca">
          <a class="rodape-nome" href="${RAIZ}" aria-label="${marca}, página inicial"><span data-digital aria-hidden="true"></span><b>${marca}<em>.</em></b></a>
          <p>Camisetas cristãs em edição limitada. ${esc(loja.tagline.charAt(0).toUpperCase() + loja.tagline.slice(1))}, feito para lembrar quem Deus disse que você é.</p>
        </div>
        <a class="btn rodape-cta" href="${wa}" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
      </div>
      <div class="rodape-grade">
        <nav class="rodape-col" aria-label="Loja"><h4>Loja</h4>
          <a href="${RAIZ}#pecas">As peças</a><a href="${RAIZ}#colecoes">Coleções</a><a href="${RAIZ}sacola/">Sua sacola</a></nav>
        <nav class="rodape-col" aria-label="A marca"><h4>A marca</h4>
          <a href="${RAIZ}sobre/">Sobre a Sê Tu</a><a href="${RAIZ}#duvidas">Perguntas frequentes</a></nav>
        <nav class="rodape-col" aria-label="Contato"><h4>Fale com a gente</h4>
          <a href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>${loja.instagram ? `<a href="${esc(loja.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}</nav>
        ${entrega ? `<div class="rodape-col"><h4>Entrega</h4><ul class="rodape-lista">${entrega}</ul></div>` : ''}
      </div>
      <div class="rodape-fim">
        <p>© ${new Date().getFullYear()} ${marca}. Não quem o mundo quer que você seja.</p>
        <a class="rodape-topo-link" href="#topo">Voltar ao topo <span aria-hidden="true">↑</span></a>
      </div>
    </div>`;
  }

  if (!/\/sacola\/?(index\.html)?$/.test(location.pathname)) {
    const a = document.createElement('a');
    a.className = 'zap';
    a.href = linkZap(loja.whatsapp);
    a.setAttribute('aria-label', 'Falar com a Sê Tu no WhatsApp');
    a.innerHTML = ICONE_ZAP;
    document.body.appendChild(a);
  }
  document.querySelectorAll('[data-zap]').forEach((el) => {
    el.href = linkZap(loja.whatsapp, el.dataset.zap || 'Oi, Sê Tu!');
  });
  injetarSimbolo();
  contador();
  iniciarGaveta();
  window.addEventListener('sacola:mudou', contador);
}

function contador() {
  const n = quantidade();
  document.querySelectorAll('.sacola-n').forEach((e) => { e.textContent = n; e.dataset.n = n; });
}

document.documentElement.classList.add('js');
instalarFallbackImagens();
instalarHoverAlt();
const loja = await carregarLoja();
montar(loja);
iniciarRastreio();

// garantia: se o script da página falhar, o rodapé aparece mesmo assim
setTimeout(() => document.body.classList.add('pronto'), 3500);

// header ganha corpo e sombra suave ao rolar
const _h = () => document.querySelector('.header')?.classList.toggle('rolou', window.scrollY > 8);
window.addEventListener('scroll', _h, { passive: true });
_h();
