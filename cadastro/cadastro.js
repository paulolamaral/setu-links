  const eventDate = new Date('2026-09-12T18:00:00');

  function updateCountdown(){
    const now = new Date();
    let diff = eventDate - now;
    if(diff < 0) diff = 0;

    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins = Math.floor((diff / (1000*60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    document.getElementById('bar-days').textContent = String(days).padStart(2,'0');
    document.getElementById('bar-hours').textContent = String(hours).padStart(2,'0');
    document.getElementById('bar-min').textContent = String(mins).padStart(2,'0');
    document.getElementById('bar-sec').textContent = String(secs).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const WEBHOOK_URL = 'https://webhook.pwinteligenciadigital.com.br/webhook/cadEventoIdentidade';

  const whatsappInput = document.getElementById('whatsapp');
  whatsappInput.addEventListener('input', (e) => {
    let digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 0) formatted = '(' + digits.slice(0, 2);
    if (digits.length >= 3) formatted += ') ' + digits.slice(2, digits.length <= 10 ? 6 : 7);
    if (digits.length > 6 && digits.length <= 10) formatted += '-' + digits.slice(6, 10);
    if (digits.length > 7 && digits.length === 11) formatted += '-' + digits.slice(7, 11);
    e.target.value = formatted;
  });
  whatsappInput.addEventListener('keypress', (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  });

  const form = document.getElementById('regForm');
  const errorMsg = document.getElementById('errorMsg');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    // campo-isca: pessoas não veem; robôs preenchem. Finge sucesso e não envia nada.
    if (document.getElementById('website').value) {
      document.getElementById('formView').style.display = 'none';
      document.getElementById('successView').style.display = 'block';
      return;
    }
    // remove caracteres de controle e de inversão de texto, limita o tamanho
    const limpar = (v, max) => String(v).replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
    const nome = limpar(document.getElementById('nome').value, 80);
    const whatsapp = limpar(document.getElementById('whatsapp').value, 15);
    const email = limpar(document.getElementById('email').value, 120);
    const whatsappDigits = whatsapp.replace(/\D/g, '');

    if(!nome || !whatsapp || !email){
      errorMsg.textContent = 'Preencha todos os campos para confirmar.';
      errorMsg.style.display = 'block';
      return;
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      errorMsg.textContent = 'Digite um e-mail válido.';
      errorMsg.style.display = 'block';
      return;
    }

    if(whatsappDigits.length < 10){
      errorMsg.textContent = 'Digite um WhatsApp válido, com DDD.';
      errorMsg.style.display = 'block';
      return;
    }

    if (!/^https:\/\//.test(WEBHOOK_URL)) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const params = new URLSearchParams();
    params.append('nome', nome);
    params.append('whatsapp', whatsapp);
    params.append('email', email);
    params.append('evento', 'Sê Tu — 12/09/2026');
    params.append('timestamp', new Date().toISOString());

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      // modo no-cors não permite ler a resposta do servidor,
      // então assumimos sucesso se o envio não gerar erro de rede
      document.getElementById('formView').style.display = 'none';
      document.getElementById('successView').style.display = 'block';
    } catch (err) {
      console.error('Erro ao enviar para o webhook:', err);
      errorMsg.textContent = 'Não foi possível confirmar agora. Tente novamente.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar presença';
    }
  });
