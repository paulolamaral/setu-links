// Se o script principal não iniciar (cache antigo, arquivo aberto direto, bloqueio), mostra um aviso útil em vez de ficar parado.
setTimeout(function () {
  if (document.documentElement.classList.contains('js')) return;
  var m = document.getElementById('principal') || document.body;
  var p = document.createElement('p');
  p.style.cssText = 'padding:24px;text-align:center;font:16px system-ui;color:#3A2318';
  p.textContent = location.protocol === 'file:'
    ? 'Abra o site por um servidor local (Live Server ou "npx serve ."). Abrindo o arquivo direto, o navegador bloqueia os scripts.'
    : 'Não foi possível carregar esta página. Recarregue com Ctrl+F5.';
  m.insertBefore(p, m.firstChild);
}, 4000);
