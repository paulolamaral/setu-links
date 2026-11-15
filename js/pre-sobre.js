// Roda antes de a página ser pintada: decide o modo da página Sobre, para ela já nascer animada (sem piscar a versão parada).
// Se mais tarde a digital não carregar, sobre-historia.js remove a classe e a página cai no modo parado.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('sobre-anim');
