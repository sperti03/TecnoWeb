// Aggiunge un listener per l'evento di submit al form con id 'studyForm'
document.getElementById('studyForm').addEventListener('submit', function(event) {
  
  // Previene il comportamento di default dell'evento, che sarebbe il submit del form
  event.preventDefault();

  // Ottiene il tempo di studio inserito dall'utente e lo converte in un numero intero
  const divetohide = document.getElementById('studyForm');
  divetohide.style.display = "none";

  const time = document.getElementById('timerDisplay');

  const stimages = document.getElementById('studyingImages');
  const brimages = document.getElementById('breakImages');

  stimages.style.display = "flex";
  const studyTime = parseInt(document.getElementById('studyTime').value, 10);
  const pauseTime = parseInt(document.getElementById('pauseTime').value, 10);
  let cycles = parseInt(document.getElementById('cycles').value, 10);
  let interval;
  // Converte i minuti in secondi per l'animazione
  const studyanimationDuration = studyTime * 60; 
  const pauseanimationDuration = pauseTime *60;
  const styleSheet= document.createElement("style");
  isstudy();


  function isstudy(){
    
  time.style.display = "block";

      if(cycles==0){
      textOnClock.textContent = "The End";
      stimages.style.display = "none";
      time.style.display = "none";
      divetohide.style.display = "block";
      return;
    }
    textOnClock.textContent = "STUDY";
    clearInterval(interval);     
    document.getElementById('timerDisplay').textContent = "";
    document.documentElement.style.setProperty('--main-color','hsl(45, 100%, 71%)');
    document.documentElement.style.setProperty('--second-color','hsl(45, 100%, 81%)');
    document.documentElement.style.setProperty('--third-color','hsl(45, 100%, 61%)');
    document.documentElement.style.setProperty('--fourth-color','hsl(45, 100%, 51%)');
    document.documentElement.style.setProperty('--fifth-color','hsl(45, 100%, 31%)');
    document.documentElement.style.setProperty('--sixth-color','hsl(45, 100%, 41%)');

    styleSheet.innerText = `

    .ice {
      animation: none;
    }

    .bubble {
      animation: none;
    }

    .bubble::before {
      animation: none;
    }

    .bubble::after {
      animation: none;
    }
  `;

 // Aggiorna le animazioni nel prossimo frame di animazione
  requestAnimationFrame(function() {
    styleSheet.innerText = `

      .ice {
        animation: shade ${studyanimationDuration}s linear forwards,
                    melt ${studyanimationDuration}s linear forwards ;
      }

      .bubble {
        animation: rotate ${studyanimationDuration}s linear forwards;
      }

      .bubble::before {
        animation: rotateBefore ${studyanimationDuration}s linear forwards;
      }

      .bubble::after {
        animation: rotateAfter ${studyanimationDuration}s linear forwards;
      }

    `;
  }); 

  // Aggiunge il foglio di stile creato all'elemento head del documento
  document.head.appendChild(styleSheet);


 // Calcola il tempo di fine aggiungendo la durata del timer al tempo corrente
 const endTime = Date.now() + studyTime * 60000; 

 // Imposta un intervallo che si ripete ogni secondo
   interval = setInterval(function() {
   const now = Date.now();
   // Calcola la differenza tra il tempo di fine e il tempo corrente
   const difference = endTime - now;
   
   // Se la differenza è minore o uguale a 0, ferma l'intervallo
   if (difference <= 0) {
    setTimeout(function() {
      time.style.display = "none";
      stimages.style.display = "none";
      brimages.style.display = "flex";
      clearInterval(interval);
      // Pulisce il testo dell'elemento con id 'timerDisplay'
      document.getElementById('timerDisplay').textContent = "";  
      ispause();
    }, 0);
   
   }

   // Calcola i minuti e i secondi rimanenti
   const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
   const seconds = Math.floor((difference % (1000 * 60)) / 1000);
   
   // Visualizza il tempo rimanente nell'elemento con id 'timerDisplay'
  //padstart aggiunge uno zero prima della stringa se non raggiunge almeno una lunghezza di 2
   document.getElementById('timerDisplay').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
 }, 1000);
  
}
  

  function ispause(){

    
    time.style.display = "block";
    textOnClock.textContent = "BREAK";
    document.getElementById('timerDisplay').textContent = "";
    document.documentElement.style.setProperty('--main-color','hsl(215, 100%, 71%)');
    document.documentElement.style.setProperty('--second-color','hsl(215, 100%, 81%)');
    document.documentElement.style.setProperty('--third-color','hsl(215, 100%, 61%)');
    document.documentElement.style.setProperty('--fourth-color','hsl(215, 100%, 51%)');
    document.documentElement.style.setProperty('--fifth-color','hsl(215, 100%, 31%)');
    document.documentElement.style.setProperty('--sixth-color','hsl(215, 100%, 41%)');

    styleSheet.innerText = `

    .ice {
      animation: none;
    }

    .bubble {
      animation: none;
    }

    .bubble::before {
      animation: none;
    }

    .bubble::after {
      animation: none;
    }

  `;



 // Aggiorna le animazioni nel prossimo frame di animazione
  requestAnimationFrame(function() {
    styleSheet.innerText = `

      .ice {
        animation: shade ${pauseanimationDuration}s linear forwards reverse,
                    melt ${pauseanimationDuration}s linear forwards reverse;
      }

      .bubble {
        animation: rotate ${pauseanimationDuration}s linear forwards;
      }

      .bubble::before {
        animation: rotateBefore ${pauseanimationDuration}s linear forwards;
      }

      .bubble::after {
        animation: rotateAfter ${pauseanimationDuration}s linear forwards;
      }

    `;
  });

  // Aggiunge il foglio di stile creato all'elemento head del documento
  document.head.appendChild(styleSheet);
  

  // Calcola il tempo di fine aggiungendo la durata del timer al tempo corrente
  const pauseendTime = Date.now() + pauseTime * 60000; 
  
  // Imposta un intervallo che si ripete ogni secondo
  interval = setInterval(function() {
   const now = Date.now();
   // Calcola la differenza tra il tempo di fine e il tempo corrente
   const difference = pauseendTime - now;
   
   // Se la differenza è minore o uguale a 0, ferma l'intervallo
   if (difference <= 0) {
    setTimeout(function() {
      time.style.display = "none";
      brimages.style.display = "none";
      stimages.style.display = "flex";
      cycles--;
      clearInterval(interval);
      document.getElementById('timerDisplay').textContent = "";
      isstudy();
    }, 0);
   
   }
   
   
  
   // Calcola i minuti e i secondi rimanenti
   const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
   const seconds = Math.floor((difference % (1000 * 60)) / 1000);
   
   // Visualizza il tempo rimanente nell'elemento con id 'timerDisplay'
  //padstart aggiunge uno zero prima della stringa se non raggiunge almeno una lunghezza di 2
   document.getElementById('timerDisplay').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
  }

})  
;

