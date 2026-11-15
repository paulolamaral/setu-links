// Página Sobre, segunda parte: uma camiseta é CONSTRUÍDA conforme a rolagem, e cada etapa traz uma parte do manifesto.
//   1. contorno traçado   2. costuras (ponto a ponto)   3. tecido   4. a estampa: a digital, linha a linha   5. a etiqueta
// Tudo é desenhado em vetor, sem fotos nem bibliotecas, e ligado ao movimento da rolagem (nada dispara sozinho).
// Sem movimento (prefers-reduced-motion) ou sem JS: a camiseta aparece pronta e os textos ficam empilhados.
import { url } from './util.js?v=424230757c';

const secao = document.getElementById('construcao');
const alvo = document.getElementById('sbc-camiseta');
const passos = [...document.querySelectorAll('#sbc-passos .sbc-passo')];
const contador = document.getElementById('sbc-contador');
const barra = document.getElementById('sbc-barra');
const riscas = [...document.querySelectorAll('.sbc-riscas [data-risca]')];

const NS = 'http://www.w3.org/2000/svg';
const CAFE = '#3A2318', TERRA = '#C05A36', PERG = '#FAF4EC', FORRO = '#52332a';
const lim = (v) => Math.min(1, Math.max(0, v));
const suave = (t) => t * t * (3 - 2 * t);
const seg = (p, a, b) => lim((p - a) / (b - a));
const el = (tag, attrs = {}, pai) => {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (pai) pai.appendChild(e);
  return e;
};
const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Linhas da digital (cada subcaminho "M…Z"), de cima para baixo, com a cruz por último. */
async function linhasDaDigital() {
  const txt = await (await fetch(url('assets/brand/digital.svg'))).text();
  const vb = txt.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  const d = txt.match(/ d="([^"]+)"/)?.[1];
  if (!vb || !d) return null;
  const itens = (d.match(/M[^M]*?Z/g) || []).map((dd) => {
    const n = dd.match(/-?\d+\.?\d*/g).map(Number);
    const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2);
    const cruz = Math.max(...ys) - Math.min(...ys) < 60 && Math.max(...xs) - Math.min(...xs) < 40 && Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 188) < 6;
    return { d: dd, ymin: Math.min(...ys), cruz };
  });
  itens.sort((a, b) => (a.cruz - b.cruz) || (a.ymin - b.ymin));
  return { vb, itens };
}

async function montar() {
  const svg = el('svg', { viewBox: '0 0 400 440', focusable: 'false', 'aria-hidden': 'true' });
  alvo.replaceChildren(svg);

  // ---------- geometria da camiseta (visão frontal, gola redonda) ----------
  const CORPO = 'M158 34 L88 58 L18 146 L66 178 L100 164 L104 404 L296 404 L300 164 L334 178 L382 146 L312 58 L242 34 Q200 98 158 34 Z';
  const FORRO_D = 'M158 34 Q200 54 242 34 Q200 98 158 34 Z';          // o avesso da gola, visto por dentro
  const NUCA = 'M158 34 Q200 54 242 34';
  const GOLA = 'M150 36 Q200 112 250 36';
  const COSTURAS = [
    'M88 58 Q124 108 100 164', 'M312 58 Q276 108 300 164',            // cavas
    'M24 138 L72 170', 'M376 138 L328 170',                            // barras das mangas
    'M112 392 L288 392',                                               // barra
    'M156 44 Q200 108 244 44',                                         // pesponto da gola
  ];

  el('path', { d: FORRO_D, fill: FORRO, 'fill-opacity': '0' }, svg);
  const forro = svg.lastChild;
  const corpo = el('path', { d: CORPO, fill: CAFE, 'fill-opacity': '0', stroke: CAFE, 'stroke-width': '2.4', 'stroke-linejoin': 'round' }, svg);
  const nuca = el('path', { d: NUCA, fill: 'none', stroke: CAFE, 'stroke-width': '2', 'stroke-linecap': 'round' }, svg);
  const gola = el('path', { d: GOLA, fill: 'none', stroke: CAFE, 'stroke-width': '2', 'stroke-linecap': 'round' }, svg);
  const contornos = [corpo, nuca, gola];
  contornos.forEach((p) => { const L = p.getTotalLength(); p._len = L; p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`; });

  // costuras: pontinhos ao longo de cada linha, que aparecem em sequência (como uma agulha)
  const pontos = [];
  COSTURAS.forEach((d) => {
    const guia = el('path', { d, fill: 'none', stroke: 'none' }, svg);
    const L = guia.getTotalLength();
    for (let s = 0; s + 5 < L; s += 9.5) {
      const a = guia.getPointAtLength(s), b = guia.getPointAtLength(s + 5);
      pontos.push(el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), stroke: TERRA, 'stroke-width': '2', 'stroke-linecap': 'round', opacity: '0' }, svg));
    }
    guia.remove();
  });

  // estampa: a digital do logo, no peito
  const dig = await linhasDaDigital();
  const linhas = [];
  if (dig) {
    const esc = 0.46, w = dig.vb[2] * esc;
    const g = el('g', { transform: `translate(${(200 - w / 2 - dig.vb[0] * esc).toFixed(2)} ${(104 - dig.vb[1] * esc).toFixed(2)}) scale(${esc})` }, svg);
    dig.itens.forEach((it) => {
      const p = el('path', { d: it.d, fill: PERG, 'fill-opacity': '0', stroke: PERG, 'stroke-width': '2.2', 'stroke-linejoin': 'round' }, g);
      const L = p.getTotalLength(); p._len = L; p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`;
      linhas.push(p);
    });
  }

  // etiqueta no avesso da gola
  const etiqueta = el('text', { x: '200', y: '53', 'text-anchor': 'middle', 'font-family': 'Lora, Georgia, serif', 'font-size': '9', 'font-weight': '500', fill: PERG, opacity: '0' }, svg);
  etiqueta.textContent = 'Sê Tu';

  // ---------- estado a partir do progresso p (0 a 1) ----------
  const aplicar = (p) => {
    // 1. contorno
    const c0 = seg(p, 0.02, 0.12), c1 = seg(p, 0.1, 0.16), c2 = seg(p, 0.14, 0.2);
    [c0, c1, c2].forEach((u, i) => { contornos[i].style.strokeDashoffset = `${(contornos[i]._len * (1 - suave(u))).toFixed(1)}`; });
    // 2. costuras
    const nP = pontos.length;
    pontos.forEach((pt, i) => { pt.setAttribute('opacity', seg(p, 0.22, 0.38) * nP > i ? '1' : '0'); });
    // 3. tecido
    const tecido = suave(seg(p, 0.42, 0.56));
    corpo.setAttribute('fill-opacity', tecido.toFixed(3));
    forro.setAttribute('fill-opacity', tecido.toFixed(3));
    // 4. estampa linha a linha
    const b = seg(p, 0.6, 0.78), dur = 0.3, M = linhas.length;
    linhas.forEach((ln, i) => {
      const u = lim((b - (i / M) * (1 - dur)) / dur);
      ln.style.strokeDashoffset = `${(ln._len * (1 - suave(u))).toFixed(1)}`;
      ln.setAttribute('fill-opacity', lim((u - 0.55) / 0.45).toFixed(3));
    });
    // 5. etiqueta
    etiqueta.setAttribute('opacity', suave(seg(p, 0.82, 0.9)).toFixed(3));
  };
  return aplicar;
}

async function iniciar() {
  if (!secao || !alvo || !passos.length) return;
  let aplicar;
  try { aplicar = await montar(); } catch (e) { document.documentElement.classList.remove('sobre-anim'); return; }      // sem a camiseta, a página fica só com os textos
  if (reduzido) { aplicar(1); riscas.forEach((r) => r.style.setProperty('--r', '1')); return; }

  const N = passos.length;
  let ativo = -1, pendente = false;
  const atualizar = () => {
    pendente = false;
    const r = secao.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total > 0 ? lim(-r.top / total) : 0;
    aplicar(p);

    passos.forEach((ps, i) => {
      const c = (i + 0.5) / N;
      const dist = Math.abs(p - c) * N;
      let op = lim((0.5 - dist) / 0.16);
      if (i === 0 && p < c) op = 1;
      if (i === N - 1 && p > c) op = 1;
      ps.style.opacity = op.toFixed(3);
      ps.style.transform = `translateY(${((c - p) * N * 22).toFixed(1)}px)`;
      ps.style.visibility = op < 0.01 ? 'hidden' : 'visible';
    });

    // "na contramão": as linhas riscam as frases enquanto o passo 3 está em cena
    const u = seg(p, 0.4, 0.52);
    riscas.forEach((rk, i) => rk.style.setProperty('--r', lim(u * riscas.length - i * 0.9).toFixed(3)));

    const i = Math.min(N - 1, Math.floor(p * N));
    if (i !== ativo) {
      ativo = i;
      passos.forEach((ps, n) => (n === i ? ps.setAttribute('data-on', '') : ps.removeAttribute('data-on')));
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

// Convite final: a foto do casal começa ampliada e assenta enquanto a seção sobe na tela (ligado à rolagem).
const foto = document.getElementById('sbj-foto');
const convite = document.getElementById('convite');
if (foto && convite && !reduzido) {
  let pend = false;
  const zoom = () => {
    pend = false;
    const r = convite.getBoundingClientRect();
    const u = lim(1 - r.top / innerHeight);              // 0 quando entra, 1 quando ocupa a tela
    foto.style.setProperty('--z', (1.14 - 0.14 * suave(u)).toFixed(4));
  };
  const ped = () => { if (!pend) { pend = true; requestAnimationFrame(zoom); } };
  addEventListener('scroll', ped, { passive: true });
  addEventListener('resize', ped);
  zoom();
}
