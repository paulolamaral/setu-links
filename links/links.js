    // Data/hora do evento: 12/09/2026, 18h (horário de Brasília, UTC-3)
    // Construído com Date.UTC para evitar problemas de parsing de fuso horário
    // entre navegadores: 18h em Brasília (UTC-3) = 21h em UTC.
    var eventDate = Date.UTC(2026, 8, 12, 21, 0, 0);

    var elDays = document.getElementById('cd-days');
    var elHours = document.getElementById('cd-hours');
    var elMinutes = document.getElementById('cd-minutes');
    var elSeconds = document.getElementById('cd-seconds');
    var elBlock = document.querySelector('.event-block');
    var elCountdown = document.getElementById('countdown');
    var elNote = document.querySelector('.event-note');

    function pad(n){ n = String(n); return n.length < 2 ? '0' + n : n; }

    function updateCountdown(){
      var now = new Date().getTime();
      var diff = eventDate - now;

      if (diff <= 0){
        elCountdown.innerHTML = '<span class="event-closed">O momento chegou.</span>';
        if (elNote) elNote.textContent = 'A Sê Tu já começou a se revelar.';
        clearInterval(timer);
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((diff % (1000 * 60)) / 1000);

      elDays.textContent = pad(days);
      elHours.textContent = pad(hours);
      elMinutes.textContent = pad(minutes);
      elSeconds.textContent = pad(seconds);
    }

    updateCountdown();
    var timer = setInterval(updateCountdown, 1000);
  
