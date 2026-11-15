import { esc } from './util.js?v=424230757c';
import { carregarLoja } from './seguranca.js?v=424230757c';

// Versículos vêm de data/loja.json (regra da marca: referências bíblicas só a partir da configuração)
const loja = await carregarLoja();
document.querySelectorAll('[data-versiculo]').forEach((el) => {
  const v = loja.versiculos?.[el.dataset.versiculo];
  if (!v) { el.remove(); return; }
  el.innerHTML = `<p class="verso-texto">“${esc(v.texto)}”</p><p class="verso-ref">${esc(v.ref)}</p>`;
});
document.querySelectorAll('[data-instagram]').forEach((a) => { if (loja.instagram) { a.href = loja.instagram; a.target = '_blank'; a.rel = 'noopener noreferrer'; } else a.remove(); });
