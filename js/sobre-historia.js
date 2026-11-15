// Página Sobre: a rolagem conduz uma história em torno da digital do logo.
//  1. a digital é CONSTRUÍDA linha a linha (18 linhas, de cima para baixo, a cruz por último): cada contorno é traçado e depois preenchido;
//  2. concluída, mergulhamos na cruz do centro (zoom), e o fundo passa de café a terracota e a pergaminho;
//  3. os textos se dissolvem um no outro, sempre ligados ao movimento da rolagem (nada dispara sozinho).
// Na seção "na contramão", uma linha risca cada frase do mundo conforme ela chega.
// Sem movimento (prefers-reduced-motion) ou sem JS: tudo aparece parado e legível, em blocos empilhados.
import { injetarSimbolo, url } from './util.js?v=adb5b385e5';

const secao = document.getElementById('historia');
const digital = document.getElementById('sbh-digital');
const blocos = [...document.querySelectorAll('#sbh-textos .sbh-bloco')];
const contador = document.getElementById('sbh-contador');
const barra = document.getElementById('sbh-barra');
injetarSimbolo();

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lim = (v) => Math.min(1, Math.max(0, v));
const suave = (t) => t * t * (3 - 2 * t);
const mistura = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const NS = 'http://www.w3.org/2000/svg';

/** Lê digital.svg e separa em linhas (cada subcaminho "M…Z" é uma linha da impressão digital). */
async function montarLinhas() {
  const txt = await (await fetch(url('assets/brand/digital.svg'))).text();
  const vb = txt.match(/viewBox="([^"]+)"/)?.[1];
  const d = txt.match(/ d="([^"]+)"/)?.[1];
  if (!vb || !d) return null;
  const partes = d.match(/M[^M]*?Z/g) || [];
  const itens = partes.map((dd) => {
    const n = dd.match(/-?\d+\.?\d*/g).map(Number);
    const ys = n.filter((_, i) => i % 2); const xs = n.filter((_, i) => i % 2 === 0);
    return { d: dd, ymin: Math.min(...ys), cruz: Math.max(...ys) - Math.min(...ys) < 60 && Math.max(...xs) - Math.min(...xs) < 40 && Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 188) < 6 };
  });
  // de cima para baixo; a cruz (ponto de partida do zoom) fica por último
  itens.sort((a, b) => (a.cruz - b.cruz) || (a.ymin - b.ymin));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', vb);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const caminhos = itens.map((it) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', it.d);
    p.setAttribute('fill', 'currentColor');
    p.setAttribute('fill-opacity', '0');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '0.9');
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return p;
  });
  digital.replaceChildren(svg);
  caminhos.forEach((p) => {
    const len = p.getTotalLength();
    p._len = len;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });
  return caminhos;
}

async function iniciar() {
  if (!secao || !digital || !blocos.length || reduzido) return;
  let linhas = null;
  try { linhas = await montarLinhas(); } catch (e) { linhas = null; }
  if (!linhas || !linhas.length) { document.documentElement.classList.remove('sobre-anim'); return; }   // sem a digital, a página cai no modo parado

  const CAFE = [58, 35, 24], TERRA = [192, 90, 54], PERG = [250, 244, 236], BRASA = [232, 149, 106];
  const N = blocos.length;
  const M = linhas.length;
  const FIM_CONSTRUCAO = 0.5;                    // até aqui a digital está sendo construída
  let ativo = -1, pendente = false;

  const atualizar = () => {
    pendente = false;
    const r = secao.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total > 0 ? lim(-r.top / total) : 0;

    // fundo e texto: café -> terracota (a cruz) -> pergaminho (a convicção)
    const t1 = suave(lim((p - 0.5) / 0.1));
    const t2 = suave(lim((p - 0.76) / 0.1));
    secao.style.setProperty('--sbh-fundo', rgb(mistura(mistura(CAFE, TERRA, t1), PERG, t2)));
    secao.style.setProperty('--sbh-texto', rgb(mistura(PERG, CAFE, t2)));
    secao.style.setProperty('--sbh-acento', rgb(mistura(BRASA, TERRA, t2)));

    // construção linha a linha: cada linha tem a sua fatia (com sobreposição) e é traçada, depois preenchida
    const b = lim(p / FIM_CONSTRUCAO) * 1.0;
    const dur = 0.26;
    linhas.forEach((el, i) => {
      const inicio = (i / M) * (1 - dur);
      const u = lim((b - inicio) / dur);
      const e = suave(u);
      el.style.strokeDashoffset = `${(el._len * (1 - e)).toFixed(1)}`;
      el.setAttribute('fill-opacity', lim((u - 0.55) / 0.45).toFixed(3));
    });

    // zoom na cruz depois de pronta; a cor acompanha o fundo para nunca sumir
    const z = suave(lim((p - FIM_CONSTRUCAO) / 0.28));
    digital.style.transform = `scale(${(1 + 7 * z).toFixed(3)})`;
    const cor = mistura(mistura(TERRA, PERG, 0.82 * t1), TERRA, t2);
    digital.style.color = rgb(cor);
    digital.style.opacity = (0.55 - 0.18 * z).toFixed(3);

    // textos: cada um ocupa uma fatia da rolagem e se dissolve nas bordas
    blocos.forEach((bl, i) => {
      const c = (i + 0.5) / N;
      const dist = Math.abs(p - c) * N;
      let op = lim((0.5 - dist) / 0.16);
      if (i === 0 && p < c) op = 1;
      if (i === N - 1 && p > c) op = 1;
      bl.style.opacity = op.toFixed(3);
      bl.style.transform = `translateY(${((c - p) * N * 24).toFixed(1)}px)`;
      bl.style.visibility = op < 0.01 ? 'hidden' : 'visible';
    });

    const i = Math.min(N - 1, Math.floor(p * N));
    if (i !== ativo) {
      ativo = i;
      blocos.forEach((bl, n) => (n === i ? bl.setAttribute('data-on', '') : bl.removeAttribute('data-on')));
      if (contador) contador.textContent = `0${i + 1} / 0${N}`;
    }
    if (barra) barra.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const pedir = () => { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  atualizar();
}
iniciar();

// "Na contramão": a linha risca cada frase conforme ela sobe na tela (ligada à rolagem; volta se rolar de volta)
const riscas = [...document.querySelectorAll('[data-risca]')];
if (riscas.length && !reduzido) {
  let pend = false;
  const risca = () => {
    pend = false;
    const h = innerHeight;
    riscas.forEach((el) => {
      const y = el.getBoundingClientRect().top;
      el.style.setProperty('--r', lim((h * 0.88 - y) / (h * 0.3)).toFixed(3));
    });
  };
  const ped = () => { if (!pend) { pend = true; requestAnimationFrame(risca); } };
  addEventListener('scroll', ped, { passive: true });
  addEventListener('resize', ped);
  risca();
}
