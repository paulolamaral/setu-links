import { brl, linkZap } from './util.js?v=adb5b385e5';

const moeda = (v) => brl(v).replace(/ /g, ' ');

/** Monta o texto do pedido (modelo do briefing, com a cor incluída em cada linha). */
export function montarMensagem({ codigo, itens, subtotal, entrega, nome, cidade, obs }) {
  const linhas = itens.map((i) => `• ${i.p.nome} — Cor ${i.cor.nome.toLowerCase()} — Tam. ${i.tam} — ${i.qtd}x — ${moeda(i.subtotal)}`);
  return [
    'Oi, Sê Tu! Quero fazer este pedido 🤎',
    '',
    `*Pedido ${codigo}*`,
    '',
    ...linhas,
    '',
    `*Subtotal:* ${moeda(subtotal)}`,
    `*Entrega:* ${entrega}`,
    '',
    `*Nome:* ${nome}`,
    `*Cidade:* ${cidade}`,
    `*Obs.:* ${obs || '—'}`,
    '',
    'Pode me passar o total e a forma de pagamento?',
  ].join('\n');
}

export const linkWhatsApp = linkZap;

/** Registro opcional do pedido (n8n etc.). Nunca bloqueia nem quebra o envio ao WhatsApp. */
export function enviarWebhook(url, dados) {
  if (!url || !/^https:\/\//.test(url)) return;
  try {
    fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: new URLSearchParams(dados) }).catch(() => {});
  } catch (e) { /* ignora */ }
}
