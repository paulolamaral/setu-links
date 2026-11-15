// Gera o corpo da página da bio (/links/) a partir de data/loja.json e data/produtos.json.
// A digital do logo é desenhada linha a linha (CSS puro): cada subcaminho do digital.svg vira um <path> com pathLength="1".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ICONES = {
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"></circle>',
  zap: '<path d="M20.5 11.9a8.5 8.5 0 0 1-12.4 7.5L4 20.5l1.15-3.9A8.5 8.5 0 1 1 20.5 11.9Z"></path><path d="M9.2 9.6c-.2 1 .6 2.6 1.5 3.5.9.9 2.5 1.8 3.6 1.6.5-.1 1-.6 1.2-1.1l.1-.5-1.6-1-.5.7c-.7-.2-1.4-.7-1.9-1.2-.5-.5-.9-1.1-1.1-1.8l.7-.6-.9-1.6h-.5c-.5.1-.9.5-1.1 1Z" fill="currentColor" stroke="none"></path>',
};

function digital(raiz) {
  const svg = readFileSync(join(raiz, 'assets/brand/digital.svg'), 'utf8');
  const vb = svg.match(/viewBox="([^"]+)"/)[1];
  const d = svg.match(/ d="([^"]+)"/)[1];
  const itens = (d.match(/M[^M]*?Z/g) || []).map((dd) => {
    const n = dd.match(/-?\d+\.?\d*/g).map(Number);
    const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2);
    const cruz = Math.max(...ys) - Math.min(...ys) < 60 && Math.max(...xs) - Math.min(...xs) < 40 && Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 188) < 6;
    return { dd, ymin: Math.min(...ys), cruz };
  });
  itens.sort((a, b) => (a.cruz - b.cruz) || (a.ymin - b.ymin));   // de cima para baixo, a cruz por último
  const paths = itens.map((it, i) => `<path${it.cruz ? ' class="cruz"' : ''} d="${it.dd}" pathLength="1" style="--i:${i}"></path>`).join('');
  return `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export function paginaLinks({ html, loja, produtos, A, brl, raiz }) {
  const zapNum = String(loja.whatsapp).replace(/\D/g, '');
  const insta = loja.instagram || '';
  const user = (insta.match(/instagram\.com\/([A-Za-z0-9._]+)/) || [])[1] || '';
  const icone = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${ICONES[k]}</svg>`;

  const pecas = produtos.filter((p) => p.destaque).map((p) => {
    const cor = (p.cores || [])[0] || {};
    const foto = (cor.capa || (cor.imagens || [])[0] || '').replace(/\.webp$/, '-card.webp');
    const selo = p.modelagem ? `<span class="peca-selo">${A(p.modelagem)}</span>` : '';
    return `<a class="peca" href="../produto/${A(p.slug)}/">
        <span class="peca-foto">${foto ? `<img src="../${A(foto)}" alt="${A(p.nome)}" width="280" height="350" loading="lazy">` : ''}${selo}</span>
        <span class="peca-nome">${A(p.nome)}</span>
        <span class="peca-preco">${A(brl(p.preco))}</span>
      </a>`;
  }).join('\n      ');

  const corpo = `<!--pagina-->
<div class="fundo" aria-hidden="true"></div>
<main class="pg">
  <div class="palco">
    <div class="brilho" aria-hidden="true"></div>
    <div class="logo" role="img" aria-label="Símbolo da Sê Tu: impressão digital com uma cruz ao centro">${digital(raiz)}</div>
  </div>

  <h1 class="nome rv" style="--d:.55s">Sê <em>Tu.</em></h1>
  <p class="tag rv" style="--d:.7s"><span>Camisetas cristãs</span>streetwear com propósito</p>
  <p class="verso rv" style="--d:.85s">ouça a voz que te chama para perto.</p>

  <nav class="acoes rv" style="--d:1s" aria-label="Links da Sê Tu">
    <a class="cta" href="../">Ver a loja <span aria-hidden="true">→</span></a>
    <div class="par">
      ${zapNum ? `<a class="sec" href="https://api.whatsapp.com/send?phone=${zapNum}&amp;text=${encodeURIComponent('Oi, Sê Tu!')}" target="_blank" rel="noopener noreferrer">${icone('zap')}WhatsApp</a>` : ''}
      ${insta ? `<a class="sec" href="${A(insta)}" target="_blank" rel="noopener noreferrer">${icone('insta')}${user ? `@${A(user)}` : 'Instagram'}</a>` : ''}
    </div>
  </nav>

  ${pecas ? `<section class="pecas rv" style="--d:1.2s" aria-label="As peças">
    <div class="pecas-topo"><h2>As peças</h2><span>Tema Identidade · edição limitada</span></div>
    <div class="trilho" tabindex="0">
      ${pecas}
      <a class="peca peca-fim" href="../"><span class="peca-fim-i" aria-hidden="true">→</span><span class="peca-nome">Ver toda a loja</span></a>
    </div>
  </section>` : ''}

  <footer class="rodape-l">
    <span>Sê tu. Não quem o mundo quer que você seja.</span>
    <span>© ${new Date().getFullYear()} Sê Tu</span>
  </footer>
</main>
<!--/pagina-->`;
  return html.replace(/<!--pagina-->[\s\S]*?<!--\/pagina-->/, () => corpo);
}
