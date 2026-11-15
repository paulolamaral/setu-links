// Página da bio: inclina a digital de leve conforme o dedo ou o mouse se mexem (só efeito visual).
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var logo = document.querySelector('.logo');
  if (!logo) return;
  var raf = 0;
  function mover(x, y) {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var nx = (x / innerWidth - 0.5) * 2;     // -1 a 1
      var ny = (y / innerHeight - 0.5) * 2;
      logo.style.transform = 'perspective(700px) rotateY(' + (nx * 9).toFixed(2) + 'deg) rotateX(' + (-ny * 7).toFixed(2) + 'deg)';
    });
  }
  addEventListener('pointermove', function (e) { mover(e.clientX, e.clientY); }, { passive: true });
  addEventListener('pointerleave', function () { logo.style.transform = ''; });
})();
