/**
 * CONDORSPACE - TEAM PARALLAX
 * Gestione dell'introduzione e della registrazione cadetto
 * Versione corretta con flusso ottimizzato e sincronizzazione audio
 */

let introTimeout = null;
let introAudioPlayed = false;
let introOver = false;

// Disegna la navicella nell'intro
function drawRaptorXLogo(canvas) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Sfondo nero uniforme
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    // Navicella triangolare al centro
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

/**
 * Inizia la sequenza completa dell'intro
 * Flusso migliorato: Logo PARALLAX -> Titolo e testo -> Registrazione cadetto -> Gioco
 */
function startIntroSequence() {
    console.log("Starting Intro Sequence...");
    const introOverlay = document.getElementById('introOverlay');
    const mainLayout = document.getElementById('mainLayout');
    const startButton = document.getElementById('startButton');
    const skipIntroButton = document.getElementById('skipIntroButton');
    const introLogoCanvas = document.getElementById('introLogoCanvas');
    
    if (!introOverlay || !mainLayout) {
        console.error("Cannot start intro: required UI elements missing.");
        return;
    }
    
    window.introOver = false;
    
    // Prepara l'overlay
    introOverlay.style.opacity = '1';
    introOverlay.classList.remove('hidden');
    introOverlay.style.display = 'flex';
    
    // Disegna la navicella nel canvas
    drawRaptorXLogo(introLogoCanvas);
    
    // Nascondi il layout principale
    mainLayout.classList.remove('visible');
    if (startButton) startButton.style.display = "none";
    
    // Avvia la musica dell'intro
    if (window.AudioSystem) {
        // Ferma prima la musica del logo con fade out
        window.AudioSystem.stopAllMP3Music(1000);
        
        // Avvia la musica dell'intro dopo il fade out
        setTimeout(() => {
            console.log("Playing intro MP3 music...");
            window.AudioSystem.playIntroMP3();
            window.introAudioPlayed = true;
        }, 1100);
    }
    
    // Visualizza subito il crawler per un'esperienza più fluida
    const crawlContainer = document.getElementById('crawlContainer');
    if (crawlContainer) {
        setTimeout(() => {
            crawlContainer.style.display = 'block';
            // Suono fanfara per il testo a scorrimento
            if (window.AudioSystem && window.AudioSystem.playEpicFanfare) {
                window.AudioSystem.playEpicFanfare();
            }
        }, 1500);
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

/**
 * Gestisce il salto dell'intro sia da pulsante che da tastiera
 */
function handleSkipInteraction() {
    if (window.introOver) return;
    console.log("Intro interaction detected.");
    
    // Suono pulsante
    if (window.AudioSystem && typeof window.AudioSystem.playButtonSound === 'function') {
        window.AudioSystem.playButtonSound();
    }
    
    skipIntroVisuals();
}

/**
 * Salta la parte visiva dell'intro mantenendo l'audio
 */
function skipIntroVisuals() {
    if (window.introOver) return;
    window.introOver = true;
    console.log("Skipping/Ending Intro Visuals...");
    
    // Pulisci il timeout
    if (introTimeout) {
        clearTimeout(introTimeout);
        introTimeout = null;
    }
    
    // NON fermare la musica intro - la lasceremo in esecuzione
    
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

/**
 * Gestisce lo skip con il tasto spazio
 */
function handleIntroSkipKey(e) {
    const playerNameInput = document.getElementById('playerNameInput');
    if (e.key === " " && !window.introOver && (!playerNameInput || document.activeElement !== playerNameInput)) {
        e.preventDefault();
        handleSkipInteraction();
    }
}

/**
 * Mostra la schermata di registrazione cadetto
 * Mantiene la musica dell'intro in riproduzione
 */
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

/**
 * Completa la registrazione cadetto e procede al gioco
 * Mantiene la musica dell'intro fino all'inizio della partita
 */
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
    
    // NON cambiare la musica - la musica intro continuerà fino all'inizio effettivo del gioco
    // La musica di gameplay verrà avviata nella funzione startGame
}

/**
 * Aggiorna l'UI con il nome del cadetto
 */
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

// Esporta funzioni globalmente
window.startIntroSequence = startIntroSequence;
window.handleSkipInteraction = handleSkipInteraction;
window.showCadetRegistration = showCadetRegistration;
window.completeCadetRegistration = completeCadetRegistration;
window.drawRaptorXLogo = drawRaptorXLogo;
window.updateCadetNameInUI = updateCadetNameInUI;
window.introAudioPlayed = false; // Inizializza globalmente