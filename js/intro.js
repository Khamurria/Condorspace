/**
 * CONDORSPACE - TEAM PARALLAX
 * Gestione dell'introduzione e della registrazione cadetto
 * Versione aggiornata con sincronizzazione audio/video corretta
 */

let introTimeout = null;
let introAudioPlayed = false;
let introOver = false;

// Disegna la navicella nell'intro senza titolo duplicato
function drawRaptorXLogo(canvas) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Sfondo nero uniforme (senza bordi)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    // Solo la navicella triangolare al centro
    const centerX = w/2;
    const centerY = h/2;
    
    // Corpo principale
    ctx.beginPath();
    ctx.fillStyle = '#2a4b8d';
    ctx.moveTo(centerX, centerY - 35);
    ctx.lineTo(centerX - 25, centerY + 25);
    ctx.lineTo(centerX + 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#49daff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ali laterali
    ctx.beginPath();
    ctx.moveTo(centerX - 25, centerY + 10);
    ctx.lineTo(centerX - 45, centerY + 30);
    ctx.lineTo(centerX - 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 25, centerY + 10);
    ctx.lineTo(centerX + 45, centerY + 30);
    ctx.lineTo(centerX + 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cabina
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 25);
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.closePath();
    ctx.fillStyle = '#6ab7ff';
    ctx.fill();
    ctx.stroke();
    
    // Propulsori
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY + 25);
    ctx.lineTo(centerX - 10, centerY + 40);
    ctx.lineTo(centerX, centerY + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 15, centerY + 25);
    ctx.lineTo(centerX + 10, centerY + 40);
    ctx.lineTo(centerX, centerY + 25);
    ctx.closePath();
    ctx.fill();
    
    // Effetto bagliore
    ctx.shadowColor = '#49daff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(73, 218, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Inizia la sequenza intro
function startIntroSequence() {
    console.log("Starting Intro Sequence...");
    const introOverlay = document.getElementById('introOverlay');
    const mainLayout = document.getElementById('mainLayout');
    const startButton = document.getElementById('startButton');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const skipIntroButton = document.getElementById('skipIntroButton');
    
    if (!introOverlay || !mainLayout) {
        console.error("Cannot start intro: required UI elements missing.");
        return;
    }
    
    window.introOver = false;
    
    // Prepara l'overlay
    introOverlay.style.opacity = '1';
    introOverlay.classList.remove('hidden');
    introOverlay.style.display = 'flex';
    
    // Nascondi il layout principale
    mainLayout.classList.remove('visible');
    if (startButton) startButton.style.display = "none";
    if (gameOverOverlay) gameOverOverlay.style.display = "none";
    
    // Avvia la musica dell'intro
    if (window.AudioSystem) {
        if (typeof window.AudioSystem.playIntroMP3 === 'function' && !window.introAudioPlayed) {
            console.log("Playing intro MP3 music...");
            window.AudioSystem.playIntroMP3();
            window.introAudioPlayed = true;
        } else if (typeof window.AudioSystem.playIntroTheme === 'function' && !window.introAudioPlayed) {
            console.log("Playing intro theme...");
            window.AudioSystem.playIntroTheme();
            window.introAudioPlayed = true;
        }
    }
    
    // Delay logo animation to sync with intro crawl
    const introLogoContainer = document.getElementById('introLogoContainer');
    const crawlContainer = document.getElementById('crawlContainer');
    const introLogoCanvas = document.getElementById('introLogoCanvas');
    
    // Reset logo animation by toggling display property
    if (introLogoContainer) {
        introLogoContainer.style.display = 'none';
        setTimeout(() => {
            introLogoContainer.style.display = 'block';
            // Disegna il logo RAPTOR-X
            drawRaptorXLogo(introLogoCanvas);
        }, 1000);
    }
    
    // Start crawl with delay to avoid overlap with logo
    if (crawlContainer) {
        crawlContainer.style.display = 'none';
        setTimeout(() => {
            // Start crawl after logo has faded out
            crawlContainer.style.display = 'block';
            
            // Avvia la fanfara per il testo a scorrimento
            if (window.AudioSystem && window.AudioSystem.playEpicFanfare) {
                window.AudioSystem.playEpicFanfare();
            }
        }, 6000); // Delay crawl to avoid overlap with logo
    }
    
    // Aggiungi event listener per il pulsante skip
    if (skipIntroButton) {
        skipIntroButton.removeEventListener('click', handleSkipInteraction);
        skipIntroButton.addEventListener('click', handleSkipInteraction);
    }
    
    // Aggiungi event listener per lo skip con spazio
    window.removeEventListener('keydown', handleIntroSkipKey);
    window.addEventListener('keydown', handleIntroSkipKey);
    
    // Timer per lo skip automatico
    const introDuration = 60000; // 60 secondi
    if (introTimeout) clearTimeout(introTimeout);
    introTimeout = setTimeout(() => {
        if (!window.introOver) {
            handleSkipInteraction();
        }
    }, introDuration);
}

// Gestisce l'interazione con lo skip
function handleSkipInteraction() {
    if (window.introOver) return;
    console.log("Intro interaction detected.");
    
    // Suono pulsante
    if (window.AudioSystem && typeof window.AudioSystem.playButtonSound === 'function') {
        window.AudioSystem.playButtonSound();
    }
    
    // Passiamo direttamente alla parte visiva perché l'audio è già stato risolto
    skipIntroVisuals();
}

// Salta l'intro visivamente mantenendo la musica dell'intro
function skipIntroVisuals() {
    if (window.introOver) return;
    window.introOver = true;
    console.log("Skipping/Ending Intro Visuals...");
    
    // Pulisci il timeout
    if (introTimeout) {
        clearTimeout(introTimeout);
        introTimeout = null;
    }
    
    // Non fermiamo più la musica dell'intro qui
    // La musica dell'intro continuerà finché non viene avviato il gioco
    
    // Rimuovi event listener
    const skipIntroButton = document.getElementById('skipIntroButton');
    if (skipIntroButton) skipIntroButton.removeEventListener('click', handleSkipInteraction);
    window.removeEventListener('keydown', handleIntroSkipKey);
    
    // Nascondi l'overlay intro
    const introOverlay = document.getElementById('introOverlay');
    if (introOverlay) {
        introOverlay.style.opacity = '0';
        introOverlay.classList.add('hidden');
    }
    
    // Mostra la schermata di registrazione cadetto
    setTimeout(() => {
        showCadetRegistration();
    }, 1000);
}

// Gestisce lo skip con il tasto spazio
function handleIntroSkipKey(e) {
    const playerNameInput = document.getElementById('playerNameInput');
    if (e.key === " " && !window.introOver && (!playerNameInput || document.activeElement !== playerNameInput)) {
        e.preventDefault();
        handleSkipInteraction();
    }
}

// Mostra la schermata di registrazione cadetto
function showCadetRegistration() {
    const cadetRegistrationScreen = document.getElementById('cadetRegistrationScreen');
    
    if (cadetRegistrationScreen) {
        cadetRegistrationScreen.classList.add('active');
        
        // Renderizza il componente per la registrazione cadetto
        if (typeof renderCadetRegistration === 'function') {
            renderCadetRegistration();
        } else {
            console.error("La funzione renderCadetRegistration non è definita");
            completeCadetRegistration("Cadetto");
        }
    } else {
        console.error("Schermata registrazione cadetto non trovata!");
        completeCadetRegistration("Cadetto");
    }
}

// Completa la registrazione cadetto e vai al gioco - MANTIENE la musica dell'intro
function completeCadetRegistration(cadetName) {
    const cadetRegistrationScreen = document.getElementById('cadetRegistrationScreen');
    const mainLayout = document.getElementById('mainLayout');
    const startButton = document.getElementById('startButton');
    
    if (cadetRegistrationScreen) {
        cadetRegistrationScreen.classList.remove('active');
    }
    
    if (mainLayout) {
        mainLayout.classList.add('visible');
    }
    
    if (startButton) {
        startButton.style.display = 'block';
        startButton.disabled = false;
        startButton.focus();
    }
    
    console.log("Registrazione cadetto completata:", cadetName);
    
    // Salva il nome del cadetto per il gioco
    if (window.game) {
        window.game.cadetName = cadetName;
        
        // Aggiorna UI con il nome del cadetto
        updateCadetNameInUI(cadetName);
    }
    
    // Assicurati che il sottotitolo rimanga invariato
    const subtitleElement = document.querySelector('#titleHeader h2');
    if (subtitleElement) {
        subtitleElement.textContent = "NETHEX CONTRO IL DEMAND GALATTICO";
    }
    
    // NON avviamo qui la musica di gameplay - mantenere la musica dell'intro
    // La musica di gameplay partirà solo quando si avvia effettivamente il gioco
}

// Aggiorna l'UI con il nome del cadetto
function updateCadetNameInUI(cadetName) {
    // Crea o aggiorna l'elemento per mostrare il nome del cadetto
    const uiSidebar = document.getElementById('uiSidebar');
    if (!uiSidebar) return;
    
    // Verifica se esiste già un elemento per il nome del cadetto
    let cadetNameElement = document.getElementById('cadetNameDisplay');
    
    if (!cadetNameElement) {
        // Crea un nuovo elemento per il nome del cadetto
        const cadetNameContainer = document.createElement('div');
        cadetNameContainer.id = 'cadetNameContainer';
        cadetNameContainer.style.marginTop = '10px';
        cadetNameContainer.style.marginBottom = '15px';
        cadetNameContainer.style.textAlign = 'center';
        cadetNameContainer.style.padding = '5px 0';
        cadetNameContainer.style.borderTop = '1px solid #445566';
        cadetNameContainer.style.borderBottom = '1px solid #445566';
        
        // Aggiungi titolo e nome
        cadetNameContainer.innerHTML = `
            <div style="color: #aaccff; font-size: 0.9em; margin-bottom: 3px;">PILOTA</div>
            <div id="cadetNameDisplay" style="color: #ffaa44; font-weight: bold; font-size: 1.1em;">${cadetName}</div>
            <div style="color: #aaccff; font-size: 0.8em; margin-top: 3px;">CADETTO DEL DEMAND</div>
        `;
        
        // Inserisci l'elemento dopo l'intestazione della sidebar
        const sidebarHeader = uiSidebar.querySelector('h3');
        if (sidebarHeader) {
            sidebarHeader.after(cadetNameContainer);
        } else {
            uiSidebar.prepend(cadetNameContainer);
        }
    } else {
        // Aggiorna il nome del cadetto esistente
        cadetNameElement.textContent = cadetName;
    }
}

// Sovrascrittura della funzione startGame per gestire correttamente la musica
// (da definire nell'implementazione effettiva)
window.originalStartGame = window.startGame;
window.startGame = function(restart) {
    // Ferma la musica dell'intro e avvia quella di gameplay
    if (window.AudioSystem) {
        // Ferma qualsiasi musica precedente
        if (typeof window.AudioSystem.stopAllMP3Music === 'function') {
            window.AudioSystem.stopAllMP3Music(500);
        } else if (typeof window.AudioSystem.stopAllMusic === 'function') {
            window.AudioSystem.stopAllMusic(0.5);
        }
        
        // Avvia la musica di gameplay con un breve delay
        setTimeout(() => {
            if (typeof window.AudioSystem.playGameplayMP3 === 'function') {
                window.AudioSystem.playGameplayMP3();
            } else if (typeof window.AudioSystem.playBackgroundMusic === 'function') {
                window.AudioSystem.playBackgroundMusic();
            }
        }, 600);
    }
    
    // Chiama la funzione originale
    if (typeof window.originalStartGame === 'function') {
        window.originalStartGame(restart);
    } else {
        console.error("Original startGame function not found");
    }
};

// Esporta funzioni globalmente
window.startIntroSequence = startIntroSequence;
window.handleSkipInteraction = handleSkipInteraction;
window.showCadetRegistration = showCadetRegistration;
window.completeCadetRegistration = completeCadetRegistration;
window.drawRaptorXLogo = drawRaptorXLogo;
window.updateCadetNameInUI = updateCadetNameInUI;
window.introAudioPlayed = false; // Inizializza globalmente